import type {
  ActivityProject,
  Award,
  Credential,
  Education,
  PersonalInfo,
  WorkExperience,
  UserProfile
} from "../types/profile";

const PROFILE_STORAGE_KEY = "applymate.profile";

function emptyPersonalInfo(): PersonalInfo {
  return {
    name: "",
    birthDate: "",
    email: "",
    phone: "",
    address: ""
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizePersonalInfo(value: unknown): PersonalInfo {
  const record = isRecord(value) ? value : {};

  return {
    name: stringValue(record.name),
    birthDate: stringValue(record.birthDate),
    email: stringValue(record.email),
    phone: stringValue(record.phone),
    address: stringValue(record.address)
  };
}

function normalizeEducation(value: unknown): Education {
  const record = isRecord(value) ? value : {};

  return {
    schoolName: stringValue(record.schoolName),
    major: stringValue(record.major),
    degree: stringValue(record.degree),
    startDate: stringValue(record.startDate),
    endDate: stringValue(record.endDate),
    gpa: stringValue(record.gpa)
  };
}

function normalizeCredential(value: unknown): Credential {
  const record = isRecord(value) ? value : {};

  return {
    name: stringValue(record.name),
    acquiredDate: stringValue(record.acquiredDate),
    issuer: stringValue(record.issuer)
  };
}

function normalizeActivityProject(value: unknown): ActivityProject {
  const record = isRecord(value) ? value : {};

  return {
    title: stringValue(record.title),
    startDate: stringValue(record.startDate),
    endDate: stringValue(record.endDate),
    role: stringValue(record.role),
    description: stringValue(record.description),
    techStack: stringValue(record.techStack)
  };
}

function normalizeWorkExperience(value: unknown): WorkExperience {
  const record = isRecord(value) ? value : {};

  return {
    company: stringValue(record.company),
    position: stringValue(record.position),
    startDate: stringValue(record.startDate),
    endDate: stringValue(record.endDate),
    description: stringValue(record.description)
  };
}

function normalizeAward(value: unknown): Award {
  const record = isRecord(value) ? value : {};

  return {
    name: stringValue(record.name),
    awardDate: stringValue(record.awardDate),
    issuer: stringValue(record.issuer),
    description: stringValue(record.description)
  };
}

function normalizeArray<T>(
  value: unknown,
  normalizeItem: (item: unknown) => T
): T[] {
  return Array.isArray(value) ? value.map(normalizeItem) : [];
}

export function createEmptyProfile(): UserProfile {
  return {
    personal: emptyPersonalInfo(),
    educations: [],
    credentials: [],
    extracurricularProjects: [],
    workExperiences: [],
    awards: [],
    updatedAt: null
  };
}

export function normalizeProfile(value: unknown): UserProfile {
  if (!isRecord(value)) {
    return createEmptyProfile();
  }

  return {
    personal: normalizePersonalInfo(value.personal),
    educations: normalizeArray(value.educations ?? value.education, normalizeEducation),
    credentials: normalizeArray(value.credentials, normalizeCredential),
    extracurricularProjects: normalizeArray(
      value.extracurricularProjects ?? value.projects,
      normalizeActivityProject
    ),
    workExperiences: normalizeArray(value.workExperiences, normalizeWorkExperience),
    awards: normalizeArray(value.awards, normalizeAward),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null
  };
}

export function isProfileEmpty(profile: UserProfile): boolean {
  const values = [
    ...Object.values(profile.personal),
    ...profile.educations.flatMap((education) => Object.values(education)),
    ...profile.credentials.flatMap((credential) => Object.values(credential)),
    ...profile.extracurricularProjects.flatMap((project) => Object.values(project)),
    ...profile.workExperiences.flatMap((workExperience) => Object.values(workExperience)),
    ...profile.awards.flatMap((award) => Object.values(award))
  ];

  return values.every((value) => value.trim() === "");
}

export async function getProfile(): Promise<UserProfile> {
  const result = await chrome.storage.local.get(PROFILE_STORAGE_KEY);
  return normalizeProfile(result[PROFILE_STORAGE_KEY]);
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const normalizedProfile = normalizeProfile(profile);
  await chrome.storage.local.set({
    [PROFILE_STORAGE_KEY]: {
      ...normalizedProfile,
      updatedAt: new Date().toISOString()
    }
  });
}

export async function clearProfile(): Promise<void> {
  await chrome.storage.local.remove(PROFILE_STORAGE_KEY);
}
