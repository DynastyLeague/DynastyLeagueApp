import { Player, Team } from './types';

// Client-side functions that call our API routes
export async function getTeams(): Promise<Team[]> {
  try {
    const response = await fetch('/api/teams');
    if (!response.ok) {
      throw new Error('Failed to fetch teams');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}

export async function getPlayers(): Promise<Player[]> {
  try {
    const response = await fetch('/api/players');
    if (!response.ok) {
      throw new Error('Failed to fetch players');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching players:', error);
    return [];
  }
}

// Get roster for a specific team
export async function getTeamRoster(teamId: string): Promise<Player[]> {
  try {
    const response = await fetch(`/api/players?teamId=${encodeURIComponent(teamId)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch team roster');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching team roster:', error);
    return [];
  }
}

// Get players by roster status for a team
export async function getTeamRosterByStatus(teamId: string, status: "ACTIVE" | "DEVELOPMENT" | "INJURY"): Promise<Player[]> {
  try {
    const response = await fetch(`/api/players?teamId=${encodeURIComponent(teamId)}&status=${encodeURIComponent(status)}`);
    if (!response.ok) {
      console.warn('Failed to fetch team roster by status');
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching team roster by status:', error);
    return [];
  }
}
