# Medi-Pal

A healthcare resource discovery platform for Medi-Cal beneficiaries built with React Native and Expo. 

Equally contributed by Siddhartha Javvaji and Douglas Kwok.

## Features

- 🔐 **Authentication** - Secure sign up/login with Supabase (no email confirmation required)
- 🗺️ **Google Maps Integration** - Find nearby healthcare resources with interactive maps
- 💬 **AI Chat Assistant** - Get healthcare guidance powered by ChatGPT
- 📋 **Checklist Management** - Track your healthcare appointments and tasks
- 🏥 **Resource Discovery** - Find clinics, pharmacies, dental services, and more
- 👤 **User Profile** - Manage your account and preferences

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key

# Google Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Getting Your API Keys

1. **Supabase**:

   - Go to https://supabase.com
   - Create a new project
   - Go to Settings > API
   - Copy the Project URL and anon/public key

2. **OpenAI**:

   - Go to https://platform.openai.com
   - Create an API key in your account settings
   - Copy the key

3. **Google Maps**:
   - Go to https://console.cloud.google.com
   - Create a new project or select existing
   - Enable Maps SDK for Android/iOS
   - Create an API key and restrict it to your app

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file with your API keys (see above)

3. Start the development server:

```bash
npm start
```

## Remarks

If you are running our app on iOS simulator, please disconnect the keyboard by navigating to > Simulator > I/O > Connect Hardware Keyboard and unchecking the check mark. This is because our app is optimized for native mobile experience.

## Project Structure

```
medipal_final/
├── app/
│   ├── (auth)/          # Authentication screens
│   │   ├── signin.tsx
│   │   ├── signup.tsx
│   │   ├── privacy.tsx
│   │   └── terms.tsx
│   ├── (tabs)/          # Main app screens
│   │   ├── home.tsx
│   │   ├── resources.tsx
│   │   ├── chat.tsx
│   │   ├── checklist.tsx
│   │   └── profile.tsx
│   └── _layout.tsx      # Root layout
├── components/          # Reusable components
├── constants/           # Theme and dummy data
├── lib/                 # Supabase client
└── assets/             # Images and icons
```

## Tech Stack

- **React Native** with Expo
- **Expo Router** for navigation
- **Supabase** for authentication
- **OpenAI API** for chat functionality
- **React Native Maps** with Google Maps
- **TypeScript** for type safety

## Building

To build the app:

```bash
npm run build
```

## License

Private - All rights reserved
