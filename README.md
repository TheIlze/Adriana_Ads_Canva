# Adriana Ads for Canva

Adriana Ads is a Canva app created for the Nutrameg team. It helps designers localize marketing visuals into multiple languages quickly and efficiently. 
The app extracts text elements from a design, uses OpenAI to generate translations, and inserts the results back into Canva while maintaining layout and fonts.

## Features
- Extracts text blocks from Canva designs
- Translates text into selected languages using OpenAI API
- Accepts context input to improve translation accuracy
- Preserves original fonts and layout
- Allows designer review and manual editing of translations
- Inserts translated versions as new pages labeled by language

## How to Run Locally
This app consists of two parts: backend and frontend.
First step is to install all dependencies with command:
   npm install

## 1. Backend Server

The backend handles communication with OpenAI API for translations.
Authorization is not required – this app is for internal Nutrameg use only.

To start the backend:

   npx tsx backend/server.ts

The server runs on http://localhost:3001.

Environment variables must be set in a .env file:

   OPENAI_API_KEY=your_openai_key
   CANVA_CLIENT_ID=your_canva_client_id
   CANVA_REDIRECT_URI=http://localhost:3001/api/callback

Note: For Nutrameg internal use, authorization can be skipped in the UI.

## 2. Frontend (Canva SDK UI)

The UI is built using TypeScript and React with the Canva Apps SDK.

To start the UI:

   npm run start

This will run the app locally on http://localhost:8080.

## Developer Notes
src/ – UI logic and design components
src/api/ – Translation and callback endpoints
utils/ – Helper functions

The app uses the official Canva SDK and modules
Built with the Canva Apps SDK Starter Kit

## License
This app is intended for internal use by the Nutrameg team only and must not be distributed or published externally.