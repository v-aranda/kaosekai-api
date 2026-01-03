export interface CharacterData {
  name: string;
  playerName: string;
  characterImage: string | null;
  
  stats: {
    body: number;
    senses: number;
    mind: number;
    soul: number;
  };
  
  hp: { current: number; max: number };
  determination: { current: number; max: number };
  
  rd: number;
  block: number;
  
  skills: Array<{ name: string; value: number }>;
  conditions: string[];
  
  attacks: Array<{
    name: string;
    damage: string;
    graze: string;
    critical: string;
  }>;
  
  abilities: Array<{
    name: string;
    type: 'Ação' | 'Reação' | 'Passivo' | 'Técnica';
    cost: string;
    description: string;
  }>;
  
  feats: Array<{
    name: string;
    type: 'Ação' | 'Reação' | 'Passivo' | 'Técnica';
    cost: string;
    description: string;
  }>;
  
  notes: string;
  origin: string;
  
  investigationNotes: Array<{
    id: string;
    x: number;
    y: number;
    text: string;
    imageUrl?: string;
    color: string;
    width: number;
    height: number;
  }>;
  
  inventory: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    size: number;
    quantity: number;
    type: 'CONSUMIVEL' | 'EQUIPAMENTO' | 'OUTRO';
    equipped?: boolean;
  }>;
  
  credits: number;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: AuthUser;
  access_token: string;
  token_type: string;
}

export type PartyType = 'PUBLIC' | 'PRIVATE';

export interface Party {
  id: number;
  owner_id: number;
  name: string;
  description: string;
  banner: string | null;
  type: PartyType;
  members_count: number;
  created_at: string;
  updated_at: string;
}

export interface PartyMember {
  id: number;
  party_id: number;
  user_id: number;
  created_at: string;
}
