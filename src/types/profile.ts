export type PersonalInfo = {
  name: string;
  birthDate: string;
  email: string;
  phone: string;
  address: string;
};

export type Education = {
  schoolName: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa: string;
};

export type Credential = {
  name: string;
  acquiredDate: string;
  issuer: string;
};

export type ProjectExperience = {
  title: string;
  startDate: string;
  endDate: string;
  role: string;
  description: string;
  techStack: string;
};

export type UserProfile = {
  personal: PersonalInfo;
  education: Education[];
  credentials: Credential[];
  projects: ProjectExperience[];
  updatedAt: string | null;
};
