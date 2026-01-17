export type LoginRequest = { email: string; password: string };

export type SignUpRequest = {
  username: string;
  email: string;
  password: string;
  agreedTerms: boolean;
  agreedPrivacy: boolean;
};

export type LoginResponse = {
  accessToken: string;
  username: string; 
};

// refresh도 동일 응답
export type RefreshResponse = LoginResponse;
