export interface PersonalInfo {
  name: string;
  birthDate: string;
  email: string;
  phone: string;
  address: string;
}

export interface Education {
  schoolName: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

export interface Credential {
  name: string;
  acquiredDate: string;
  issuer: string;
}

export interface LanguageScore {
  language: string;
  testName: string;
  score: string;
  acquiredDate: string;
}

export interface ActivityProject {
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  role: string;
  description: string;
  techStack: string;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Award {
  name: string;
  awardDate: string;
  issuer: string;
  description: string;
}

export interface UserProfile {
  personal: PersonalInfo;
  educations: Education[];
  credentials: Credential[];
  languageScores: LanguageScore[];
  extracurricularProjects: ActivityProject[];
  workExperiences: WorkExperience[];
  awards: Award[];
  updatedAt: string | null;
}
