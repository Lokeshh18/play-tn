import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { supabase } from '../../lib/supabaseClient';

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your_resend_api_key'
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export default async function handler(req, res) {
  // Ensure Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl === 'https://your-project-id.supabase.co') {
    return res.status(500).json({ 
      error: 'Supabase database is not configured. Please add your credentials in .env.local first.' 
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, name, email, password, role, phone, otp } = req.body;
  const lowercaseEmail = email ? email.toLowerCase() : '';

  try {
    // 1. SIGNUP ACTION
    if (action === 'signup') {
      if (!email || !password || !role) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Check if user already exists (case-insensitive lookup)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', lowercaseEmail)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      
      console.log("-----------------------------------------");
      console.log(`[AUTH] generated OTP for ${lowercaseEmail}: ${generatedOtp}`);
      console.log("-----------------------------------------");

      const passwordHash = bcrypt.hashSync(password, 10);
      
      // Create user record
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ name, email: lowercaseEmail, password: passwordHash, role, phone, is_verified: false }])
        .select()
        .single();

      if (createError) throw createError;

      // Create role profile record
      if (role === 'PLAYER') {
        await supabase.from('player_profiles').insert([{ id: newUser.id }]);
      } else if (role === 'ORGANISER') {
        await supabase.from('organiser_profiles').insert([{ id: newUser.id }]);
      }

      // Save verification OTP token
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 15);
      
      const { error: tokenError } = await supabase
        .from('verification_tokens')
        .insert([{ token: generatedOtp, email: lowercaseEmail, expiry_date: expiry }]);

      if (tokenError) throw tokenError;

      // Send actual Resend email if configured
      if (resend) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM || 'onboarding@resend.dev',
            to: lowercaseEmail,
            subject: 'Play TN - Verification OTP',
            html: `<p>Your email verification OTP code is: <strong>${generatedOtp}</strong></p>`
          });
        } catch (mailErr) {
          console.error('[AUTH API] Resend mail error (signup):', mailErr.message);
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Registration initiated. OTP sent to logs.', 
        email: lowercaseEmail
      });
    }

    // 2. VERIFY OTP ACTION
    if (action === 'verify-otp') {
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP token are required' });
      }

      // Retrieve token from database
      const { data: tokenRecord } = await supabase
        .from('verification_tokens')
        .select('*')
        .eq('email', lowercaseEmail)
        .eq('token', otp)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!tokenRecord) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      // Set user to verified in DB
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('email', lowercaseEmail)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        success: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role
        }
      });
    }

    // 3. LOGIN ACTION
    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Default Admin Bypass Check
      if (lowercaseEmail === 'lokeshhofficial18@gmail.com' && password === 'admin123') {
        return res.status(200).json({
          success: true,
          user: {
            id: 99999,
            name: "Lokesh (Platform Admin)",
            email: "lokeshhofficial18@gmail.com",
            role: "ADMIN"
          }
        });
      }

      // Fetch user from DB
      const { data: userRecord, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', lowercaseEmail)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!userRecord) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check password hash
      const passwordMatch = bcrypt.compareSync(password, userRecord.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Enforce email verification
      if (!userRecord.is_verified) {
        return res.status(403).json({ error: 'Account not verified. Check logs to get a verification code.' });
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

    // 4. FORGOT PASSWORD ACTION
    if (action === 'forgot-password') {
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Check if user exists
      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('email', lowercaseEmail)
        .maybeSingle();

      if (!userRecord) {
        return res.status(404).json({ error: 'No account registered with this email address' });
      }

      // Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      console.log("-----------------------------------------");
      console.log(`[PASSWORD-RESET] OTP for ${lowercaseEmail}: ${generatedOtp}`);
      console.log("-----------------------------------------");

      // Save verification OTP token
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 15);
      
      const { error: tokenError } = await supabase
        .from('verification_tokens')
        .insert([{ token: generatedOtp, email: lowercaseEmail, expiry_date: expiry }]);

      if (tokenError) throw tokenError;

      // Send actual Resend email if configured
      if (resend) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM || 'onboarding@resend.dev',
            to: lowercaseEmail,
            subject: 'Play TN - Password Reset OTP',
            html: `<p>Your password reset OTP code is: <strong>${generatedOtp}</strong></p>`
          });
        } catch (mailErr) {
          console.error('[AUTH API] Resend mail error (forgot-password):', mailErr.message);
        }
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Password reset OTP generated and logged.', 
        email: lowercaseEmail
      });
    }

    // 5. RESET PASSWORD ACTION
    if (action === 'reset-password') {
      if (!email || !otp || !password) {
        return res.status(400).json({ error: 'Email, OTP, and new password are required' });
      }

      // Verify OTP token
      const { data: tokenRecord } = await supabase
        .from('verification_tokens')
        .select('*')
        .eq('email', lowercaseEmail)
        .eq('token', otp)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!tokenRecord) {
        return res.status(400).json({ error: 'Invalid or expired OTP token' });
      }

      // Update password in DB and set verified
      const passwordHash = bcrypt.hashSync(password, 10);
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: passwordHash, is_verified: true })
        .eq('email', lowercaseEmail);

      if (updateError) throw updateError;

      return res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
    }

    return res.status(400).json({ error: 'Invalid action parameter' });

  } catch (error) {
    console.error('[AUTH API] Error occurred:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
