import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TENANT_NAMES = ['LinkedIn', 'Monster', 'Naukri'] as const;

const SKILL_NAMES = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Express',
  'PostgreSQL',
  'MongoDB',
  'Python',
  'Django',
  'Java',
  'Spring Boot',
  'AWS',
  'Docker',
  'Kubernetes',
  'GraphQL',
  'REST API',
  'Redis',
  'Kafka',
  'CI/CD',
  'Agile',
  'UI/UX',
  'Figma',
  'SQL',
  'Machine Learning',
  'Data Analysis',
  'Go',
  'Rust',
  'Vue.js',
  'Angular',
  'Next.js',
];

type CandidateSeed = {
  fullName: string;
  location: string;
  experienceYears: number;
  email: string;
  skillNames: string[];
};

type JobSeed = {
  jobTitle: string;
  clientName: string;
  location: string;
  minExperienceYears: number;
  numberOfOpenings: number;
  skillNames: string[];
};

const CANDIDATE_TEMPLATES: CandidateSeed[] = [
  {
    fullName: 'Aisha Khan',
    location: 'San Francisco, CA',
    experienceYears: 6,
    email: 'aisha.khan',
    skillNames: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL'],
  },
  {
    fullName: 'Ben Ortiz',
    location: 'Austin, TX',
    experienceYears: 4,
    email: 'ben.ortiz',
    skillNames: ['Python', 'Django', 'SQL', 'AWS', 'Docker'],
  },
  {
    fullName: 'Chloe Nguyen',
    location: 'Seattle, WA',
    experienceYears: 8,
    email: 'chloe.nguyen',
    skillNames: ['Java', 'Spring Boot', 'Kafka', 'Kubernetes', 'CI/CD'],
  },
  {
    fullName: 'Diego Alvarez',
    location: 'New York, NY',
    experienceYears: 3,
    email: 'diego.alvarez',
    skillNames: ['React', 'TypeScript', 'UI/UX', 'Figma', 'Next.js'],
  },
  {
    fullName: 'Elena Petrova',
    location: 'Chicago, IL',
    experienceYears: 10,
    email: 'elena.petrova',
    skillNames: ['Go', 'Kubernetes', 'Docker', 'AWS', 'Redis'],
  },
  {
    fullName: 'Farah Malik',
    location: 'Boston, MA',
    experienceYears: 5,
    email: 'farah.malik',
    skillNames: ['Node.js', 'Express', 'MongoDB', 'GraphQL', 'REST API'],
  },
  {
    fullName: 'Gabriel Costa',
    location: 'Miami, FL',
    experienceYears: 2,
    email: 'gabriel.costa',
    skillNames: ['JavaScript', 'Vue.js', 'REST API', 'Agile'],
  },
  {
    fullName: 'Hana Suzuki',
    location: 'Denver, CO',
    experienceYears: 7,
    email: 'hana.suzuki',
    skillNames: ['Machine Learning', 'Python', 'Data Analysis', 'SQL', 'AWS'],
  },
  {
    fullName: 'Ivan Petrov',
    location: 'Remote',
    experienceYears: 9,
    email: 'ivan.petrov',
    skillNames: ['Rust', 'Go', 'Kubernetes', 'CI/CD', 'Docker'],
  },
  {
    fullName: 'Jade Williams',
    location: 'Atlanta, GA',
    experienceYears: 4,
    email: 'jade.williams',
    skillNames: ['Angular', 'TypeScript', 'REST API', 'SQL', 'Agile'],
  },
  {
    fullName: 'Kenji Tanaka',
    location: 'Portland, OR',
    experienceYears: 1,
    email: 'kenji.tanaka',
    skillNames: ['JavaScript', 'React', 'Figma'],
  },
  {
    fullName: 'Lila Sharma',
    location: 'Dallas, TX',
    experienceYears: 6,
    email: 'lila.sharma',
    skillNames: ['Java', 'Spring Boot', 'PostgreSQL', 'Kafka', 'Docker'],
  },
  {
    fullName: 'Marcus Reed',
    location: 'Phoenix, AZ',
    experienceYears: 11,
    email: 'marcus.reed',
    skillNames: ['AWS', 'Kubernetes', 'CI/CD', 'Docker', 'Redis', 'Kafka'],
  },
  {
    fullName: 'Nora Berg',
    location: 'Minneapolis, MN',
    experienceYears: 3,
    email: 'nora.berg',
    skillNames: ['Python', 'Data Analysis', 'SQL', 'Machine Learning'],
  },
  {
    fullName: 'Omar Hassan',
    location: 'Washington, DC',
    experienceYears: 5,
    email: 'omar.hassan',
    skillNames: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Express'],
  },
];

const JOB_TEMPLATES: JobSeed[] = [
  {
    jobTitle: 'Senior Full Stack Engineer',
    clientName: 'Northstar Labs',
    location: 'San Francisco, CA',
    minExperienceYears: 5,
    numberOfOpenings: 2,
    skillNames: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
  },
  {
    jobTitle: 'Backend Platform Engineer',
    clientName: 'Orbit Systems',
    location: 'Remote',
    minExperienceYears: 4,
    numberOfOpenings: 1,
    skillNames: ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker'],
  },
  {
    jobTitle: 'Data / ML Engineer',
    clientName: 'Pulse Analytics',
    location: 'Chicago, IL',
    minExperienceYears: 3,
    numberOfOpenings: 3,
    skillNames: ['Python', 'Machine Learning', 'SQL', 'AWS'],
  },
  {
    jobTitle: 'Cloud DevOps Engineer',
    clientName: 'Harbor Cloud',
    location: 'Seattle, WA',
    minExperienceYears: 6,
    numberOfOpenings: 1,
    skillNames: ['AWS', 'Kubernetes', 'Docker', 'CI/CD'],
  },
  {
    jobTitle: 'Frontend Product Engineer',
    clientName: 'Brightpath',
    location: 'New York, NY',
    minExperienceYears: 2,
    numberOfOpenings: 2,
    skillNames: ['React', 'TypeScript', 'UI/UX', 'Next.js'],
  },
];

async function upsertSkills() {
  const skills = [];
  for (const name of SKILL_NAMES) {
    const skill = await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    skills.push(skill);
  }
  return new Map(skills.map((s) => [s.name, s.id]));
}

async function upsertTenants() {
  const tenants = [];
  for (const name of TENANT_NAMES) {
    const tenant = await prisma.tenant.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tenants.push(tenant);

    await prisma.recruiter.upsert({
      where: { email: `recruiter@${name.toLowerCase()}.demo` },
      update: {},
      create: {
        tenantId: tenant.id,
        name: `${name} Recruiter`,
        username: name.toLowerCase(),
        email: `recruiter@${name.toLowerCase()}.demo`,
        passwordHash: 'demo-hash-not-used',
      },
    });
  }
  return tenants;
}

async function seedTenantData(
  tenantId: string,
  tenantSlug: string,
  skillMap: Map<string, string>,
) {
  const existingCandidates = await prisma.candidate.count({ where: { tenantId } });
  if (existingCandidates > 0) {
    console.log(`Skipping candidates/jobs for tenant ${tenantSlug} (already seeded)`);
    return;
  }

  for (const c of CANDIDATE_TEMPLATES) {
    const skillIds = c.skillNames
      .map((n) => skillMap.get(n))
      .filter((id): id is string => Boolean(id));

    await prisma.candidate.create({
      data: {
        tenantId,
        fullName: c.fullName,
        location: c.location,
        experienceYears: c.experienceYears,
        email: `${c.email}@${tenantSlug.toLowerCase()}.demo`,
        phone: '+1-555-0100',
        skills: {
          create: skillIds.map((skillId) => ({ skillId })),
        },
      },
    });
  }

  for (const j of JOB_TEMPLATES) {
    const skillIds = j.skillNames
      .map((n) => skillMap.get(n))
      .filter((id): id is string => Boolean(id));

    await prisma.jobOrder.create({
      data: {
        tenantId,
        jobTitle: j.jobTitle,
        clientName: j.clientName,
        location: j.location,
        minExperienceYears: j.minExperienceYears,
        numberOfOpenings: j.numberOfOpenings,
        status: 'Open',
        skills: {
          create: skillIds.map((skillId) => ({ skillId })),
        },
      },
    });
  }
}

async function upsertAdmin() {
  const passwordHash = await bcrypt.hash('password123', 10);
  await prisma.recruiter.upsert({
    where: { username: 'admin' },
    update: {
      name: 'Admin',
      passwordHash,
      role: Role.ADMIN,
      tenantId: null,
      email: 'admin@talentfinder.local',
    },
    create: {
      username: 'admin',
      name: 'Admin',
      email: 'admin@talentfinder.local',
      passwordHash,
      role: Role.ADMIN,
      tenantId: null,
    },
  });
}

async function main() {
  console.log('Seeding TalentFinder...');
  const skillMap = await upsertSkills();
  const tenants = await upsertTenants();

  for (const tenant of tenants) {
    await seedTenantData(tenant.id, tenant.name, skillMap);
  }

  await upsertAdmin();

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });