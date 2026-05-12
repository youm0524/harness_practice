import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearProfile,
  createEmptyProfile,
  getProfile,
  isProfileEmpty,
  saveProfile
} from "./storage";

const storage = new Map<string, unknown>();

beforeEach(() => {
  storage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-12T00:00:00.000Z"));

  globalThis.chrome = {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: storage.get(key) })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.entries(items).forEach(([key, value]) => storage.set(key, value));
        }),
        remove: vi.fn(async (key: string) => {
          storage.delete(key);
        })
      }
    }
  } as unknown as typeof chrome;
});

describe("storage helpers", () => {
  it("creates an empty profile without high-risk sensitive fields", () => {
    expect(createEmptyProfile()).toEqual({
      personal: {
        name: "",
        birthDate: "",
        email: "",
        phone: "",
        address: ""
      },
      educations: [],
      credentials: [],
      extracurricularProjects: [],
      workExperiences: [],
      awards: [],
      updatedAt: null
    });
  });

  it("returns an empty profile when storage is empty or broken", async () => {
    expect(await getProfile()).toEqual(createEmptyProfile());

    storage.set("applymate.profile", "broken");

    expect(await getProfile()).toEqual(createEmptyProfile());
  });

  it("saves a normalized profile with updatedAt", async () => {
    const profile = createEmptyProfile();
    profile.personal.name = "홍길동";
    profile.educations.push({
      schoolName: "한국대학교",
      major: "컴퓨터공학",
      degree: "학사",
      startDate: "2020-03",
      endDate: "2024-02",
      gpa: "4.1"
    });

    await saveProfile(profile);

    expect(await getProfile()).toEqual({
      ...profile,
      updatedAt: "2026-05-12T00:00:00.000Z"
    });
  });

  it("clears stored profile data", async () => {
    const profile = createEmptyProfile();
    profile.personal.email = "user@example.com";

    await saveProfile(profile);
    await clearProfile();

    expect(await getProfile()).toEqual(createEmptyProfile());
  });

  it("detects empty and non-empty profiles", () => {
    const profile = createEmptyProfile();
    expect(isProfileEmpty(profile)).toBe(true);

    profile.personal.phone = "010-1234-5678";
    expect(isProfileEmpty(profile)).toBe(false);
  });

  it("migrates old projects into extracurricular projects", async () => {
    storage.set("applymate.profile", {
      projects: [
        {
          title: "교내 해커톤",
          startDate: "",
          endDate: "",
          role: "개발",
          description: "",
          techStack: "React"
        }
      ]
    });

    expect((await getProfile()).extracurricularProjects[0]).toMatchObject({
      title: "교내 해커톤",
      role: "개발",
      techStack: "React"
    });
  });
});
