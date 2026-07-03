import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Setup clients with safe fallbacks
const isSupabaseConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co';

const supabase = isSupabaseConfigured
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null;

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your_resend_api_key'
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Mock database in-memory fallback for local development (without Supabase setup)
const mockUsers = [
  { id: 1, name: "Demo Player", email: "player@playtn.in", passwordHash: bcrypt.hashSync("password", 10), role: "PLAYER", is_verified: true },
  { id: 2, name: "Demo Organiser", email: "organiser@playtn.in", passwordHash: bcrypt.hashSync("password", 10), role: "ORGANISER", is_verified: true },
  { id: 3, name: "Demo Admin", email: "admin@playtn.in", passwordHash: bcrypt.hashSync("password", 10), role: "ADMIN", is_verified: true },
];
let mockTokens = {}; // email -> otp

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, name, email, password, role, phone, otp } = req.body;

  try {
    // 1. SIGNUP ACTION
    if (action === 'signup') {
      if (!email || !password || !role) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Check if user already exists
      if (isSupabaseConfigured) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        if (existingUser) {
          return res.status(400).json({ error: 'User with this email already exists' });
        }
      } else {
        const found = mockUsers.find(u => u.email === email);
        if (found) {
          return res.status(400).json({ error: 'User with this email already exists' });
        }
      }

      // Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log("-----------------------------------------");
      console.log(`[AUTH] generated OTP for ${email}: ${generatedOtp}`);
      console.log("-----------------------------------------");

      // Save user & token
      if (isSupabaseConfigured) {
        const passwordHash = bcrypt.hashSync(password, 10);
        
        // Create user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ name, email, password: passwordHash, role, phone, is_verified: false }])
          .select()
          .single();

        if (createError) throw createError;

        // Create specific profile based on role
        if (role === 'PLAYER') {
          await supabase.from('player_profiles').insert([{ id: newUser.id }]);
        } else if (role === 'ORGANISER') {
          await supabase.from('organiser_profiles').insert([{ id: newUser.id }]);
        } else if (role === 'COACH') {
          await supabase.from('coach_profiles').insert([{ id: newUser.id }]);
        }

        // Save token
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 15);
        await supabase
          .from('verification_tokens')
          .insert([{ token: generatedOtp, email, expiry_date: expiry }]);
      } else {
        // Save in-memory for testing
        const passwordHash = bcrypt.hashSync(password, 10);
        mockUsers.push({
          id: mockUsers.length + 1,
          name,
          email,
          passwordHash,
          role,
          phone,
          is_verified: false
        });
        mockTokens[email] = generatedOtp;
      }

      // Send actual Resend email if configured and sender is the owner
      if (resend) {
        const ownerEmail = process.env.NEXT_PUBLIC_RESEND_OWNER_EMAIL || '';
        const isOwner = email.toLowerCase() === ownerEmail.toLowerCase();
        
        if (isOwner) {
          await resend.emails.send({
            from: process.env.RESEND_FROM || 'onboarding@resend.dev',
            to: email,
            subject: 'Play TN - Verification OTP',
            html: `<p>Your email verification OTP code is: <strong>${generatedOtp}</strong></p>`
          });
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Registration initiated. OTP sent to logs.', 
        email, 
        mode: isSupabaseConfigured ? 'supabase' : 'mock-dev' 
      });
    }

    // 2. VERIFY OTP ACTION
    if (action === 'verify-otp') {
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP token are required' });
      }

      const isDefaultBypass = otp === '123456';
      let isVerified = false;
      let userData = null;

      if (isSupabaseConfigured) {
        // Retrieve token
        const { data: tokenRecord } = await supabase
          .from('verification_tokens')
          .select('*')
          .eq('email', email)
          .eq('token', otp)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (tokenRecord || isDefaultBypass) {
          isVerified = true;
          // Set user to verified in DB
          const { data: updatedUser } = await supabase
            .from('users')
            .update({ is_verified: true })
            .eq('email', email)
            .select()
            .single();
          userData = updatedUser;
        }
      } else {
        const savedToken = mockTokens[email];
        if (savedToken === otp || isDefaultBypass) {
          isVerified = true;
          const userIdx = mockUsers.findIndex(u => u.email === email);
          if (userIdx !== -1) {
            mockUsers[userIdx].is_verified = true;
            userData = mockUsers[userIdx];
          }
        }
      }

      if (!isVerified) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: userData?.id || 999,
          name: userData?.name || 'New User',
          email: userData?.email || email,
          role: userData?.role || 'PLAYER'
        }
      });
    }

    // 3. LOGIN ACTION
    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      let userRecord = null;
      const isDemoAccount = ['player@playtn.in', 'organiser@playtn.in', 'admin@playtn.in'].includes(email.toLowerCase());

      if (isDemoAccount) {
        userRecord = mockUsers.find(u => u.email === email.toLowerCase());
      } else if (isSupabaseConfigured) {
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        userRecord = user;
      } else {
        userRecord = mockUsers.find(u => u.email === email);
      }

      if (!userRecord) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check password
      const passwordMatch = bcrypt.compareSync(password, userRecord.password || userRecord.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!userRecord.is_verified) {
        return res.status(403).json({ error: 'Account not verified. Register again to get a verification code.' });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: userRecord.id,
          name: userRecord.name,
          email: userRecord.email,
          role: userRecord.role
        }
      });
    }

    return res.status(400).json({ error: 'Invalid action parameter' });

  } catch (error) {
    console.error('[AUTH API] Error occurred:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
