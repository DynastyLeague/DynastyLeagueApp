# Dynasty League App - Google Sheets Integration Setup

## Overview
Your Dynasty League app now includes:
- ✅ Team login/authentication system
- ✅ Google Sheets integration for roster data
- ✅ Scrollable roster table with locked player name column
- ✅ Automatic filtering by team_id and roster_status
- ✅ Support for Active (20), Development (6), and Injury (2) roster spots

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in service account details
4. Click "Create and Continue"
5. Skip role assignment for now
6. Click "Done"

### 3. Generate Service Account Key

1. Find your service account in the credentials list
2. Click on it to open details
3. Go to "Keys" tab
4. Click "Add Key" > "Create new key"
5. Choose "JSON" format
6. Download the JSON file

### 4. Share Google Sheet

1. Open your Google Sheet
2. Click "Share" button
3. Add the service account email (from the JSON file)
4. Give it "Editor" permissions
5. Click "Send"

### 5. Environment Variables

Create a `.env.local` file in your project root with:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**Important:** 
- Get `GOOGLE_SHEETS_ID` from your sheet URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
- Get `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` from the downloaded JSON file

### 6. Google Sheet Structure

Your Google Sheet should have these tabs:

#### Teams Tab (Columns A-F):
- A: team_id
- B: team_name  
- C: team_email
- D: Team_password
- E: main_logo (URL)
- F: word_logo (URL)

#### Players Tab (Columns A-Z):
- A: Player ID
- B: Player Name
- C: Team ID (matches team code from Teams tab)
- D: Roster Status (ACTIVE/DEVELOPMENT/INJURY)
- E: NBA Team
- F: Position
- G: Age
- H: Rank Type
- I: Rank Average
- J-O: Contract Years (25-26, 26-27, 27-28, 28-29, 29-30, 30-31, 31-32)
- P: Contract Year
- Q: Signed Via
- R: Contract Notes
- S: Option
- T: Accept/Decline
- U: Ext Elig

## How It Works

1. **Global Login**: Users enter their email and password to access the entire app
2. **Team Authentication**: Login credentials (team_email/Team_password) are validated against the Teams tab in Google Sheets
3. **API Routes**: Next.js API routes (`/api/auth/login`, `/api/teams`, `/api/players`) handle Google Sheets integration server-side
4. **Data Fetching**: Client-side code calls API routes to fetch team-specific data
5. **Filtering**: Players are automatically filtered by team_id and roster_status
6. **Display**: Roster is shown in scrollable tables with locked player name column
7. **Weekly Selections**: Dropdown menus show only the logged-in team's players

## Architecture

- **Server-side**: Google Sheets API integration runs in Next.js API routes
- **Client-side**: React components call API routes using fetch()
- **Security**: Google Sheets credentials are only used server-side, never exposed to browser

## Features

- **Global Authentication**: Email/password login for entire app
- **Team Logos**: Main logos display throughout the app
- **Locked Column**: Player name column stays visible while scrolling horizontally
- **Responsive Design**: Works on mobile and desktop
- **Real-time Data**: Refresh button to get latest data from Google Sheets
- **Empty Slots**: Shows empty slots for unfilled roster positions
- **Team-specific**: Each team only sees their own players
- **Weekly Selections**: Dropdown menus populated with team's players
- **Logout**: Easy logout button in bottom navigation

## Testing

1. Start your development server: `npm run dev`
2. Navigate to any page (login will be required)
3. Enter email and password from your Teams tab
4. Verify team logo displays and roster data loads correctly
5. Test Weekly Selections dropdown shows only your team's players
6. Test logout functionality

## Troubleshooting

- **Authentication Error**: Check your service account credentials
- **Permission Error**: Ensure service account has access to the sheet
- **Data Not Loading**: Verify sheet structure matches expected format
- **Empty Results**: Check team_id values match between Teams and Players tabs
