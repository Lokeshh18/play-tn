# Play TN – Master Software Requirements & AI Build Prompt

> **Purpose:** Convert the existing static Play TN frontend into a production-ready full-stack sports management platform while preserving the current UI and branding.

## Project Vision
Play TN is a statewide sports ecosystem connecting Players, Coaches, Organisers, Administrators and (future) Venue Owners across Tamil Nadu.

## Preserve Existing UI
- Keep the current HTML/CSS/Bootstrap design.
- Do **not** redesign the hero, navbar theme, cards, leaderboard layout or footer.
- Convert all static data into backend-driven dynamic content.

## Technology Stack
- Frontend: HTML, CSS, Bootstrap, JavaScript
- Backend: Spring Boot (Java)
- Database: MySQL
- ORM: Spring Data JPA / Hibernate
- Security: Spring Security + JWT + BCrypt
- Email: JavaMailSender (SMTP)
- File Uploads: Local storage with cloud-ready abstraction
- Deployment: Frontend (Netlify/Vercel), Backend (Render/Railway), MySQL (Railway/MySQL)

## User Roles
- Player
- Coach
- Organiser
- Admin
- Future: Venue Owner

## Authentication
- Sign Up
- Sign In
- Forgot Password
- Reset Password
- Email Verification
- OTP
- Remember Me
- JWT Authentication
- Role-based authorization

## Registration
Navbar must contain:
- Register
- Sign In
- Sign Up

Register opens a role selector:
- Player
- Coach
- Organiser

## Player Profile
Store:
- Name
- Age
- DOB
- Gender
- Phone
- Email
- Password
- District
- Address
- Preferred Sport
- Experience
- Profile Picture
- Bio
- Achievements

## Coach Profile
Store coach details, certifications, specialization, sports and profile image.

## Organiser Profile
Store organisation details, contacts, logo, verification status and address.

## Tournament Workflow
Draft -> Submit -> Admin Review -> Approved -> Published -> Live -> Completed -> Archived

Only approved tournaments appear publicly.

## Tournament Creation
Organiser provides:
- Tournament Name
- Poster
- Banner
- Description
- Sport
- Registration Type
- Tournament Format
- District
- Venue
- Maps Location
- Registration Start/End
- Tournament Start/End
- Timing
- Entry Fee
- Prize Pool
- Min/Max Teams
- Reserve Players
- Contact Numbers (2)
- Email
- Rules PDF
- Sponsors
- Medical Support
- Referees

## Registration Types

### Team Sports
- Cricket
- Football
- Volleyball
- Kabaddi
- Handball

Use **Register Team**.

Captain creates team, invites players, manages roster and registers the team.

### Athletics (Individual)
Events:
- 100m
- 200m
- 400m
- 800m
- 1200m
- 1500m
- 4×100 Relay
- Shot Put
- Discus Throw
- Javelin Throw

Relay allows creating or joining a relay team.

### Badminton
Organiser chooses:
- Singles
- Doubles
- Both

Singles = Individual registration.

Doubles = Create or Join Team (2 players).

## Team Management
- Team Name
- Captain
- Vice Captain
- Team Code
- Invite by Email
- Join Requests
- Approval Workflow
- Team Logo
- Emergency Contact

## Dashboards

### Player
Profile, Notifications, Registrations, Rankings, Certificates, Saved Tournaments.

### Coach
Players, Training, Performance Reports, Notifications.

### Organiser
Create/Edit/Delete tournaments, registrations, analytics, notifications.

### Admin
Approve organisers, approve tournaments, manage users, districts, sports, analytics and broadcasts.

## Notifications
Email + In-app:
- New Tournament
- Registration Success
- Reminder
- Result Published
- Approval/Rejection

Players receive tournament emails only if preferred sport matches tournament sport.

## Leaderboards
Dynamic:
- State
- District
- Sport
- Team
- Player

Updated automatically after results.

## Search & Filters
Search:
- Player
- Team
- Tournament
- Venue
- Coach

Filters:
- Sport
- District
- Date
- Entry Fee
- Gender
- Prize Pool

## Database
Design normalized relational schema for:
Users, Roles, Players, Coaches, Organisers, Teams, TeamMembers, Sports, Events, Tournaments, Registrations, Leaderboards, Notifications, Emails, Venues, Results, Achievements, Files and supporting tables.

## Backend Quality
- DTO pattern
- Controller-Service-Repository architecture
- Validation using Jakarta Validation
- Global Exception Handling with @ControllerAdvice
- SLF4J + Logback logging
- RESTful APIs
- Swagger/OpenAPI
- Secure file uploads
- Input validation
- Rate limiting
- Environment variables
- CORS configuration

## Future Enhancements
- QR Check-in
- AI Tournament Recommendation
- GPS Nearby Grounds
- District → Zone → State progression
- Tournament Brackets
- Certificate Generation
- Docker Support

## Final Requirement
Generate a complete production-ready application without changing the existing UI. Replace every static component with backend APIs, persistent storage, authentication, dashboards and scalable architecture.
