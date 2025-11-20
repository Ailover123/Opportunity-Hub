export const mockHackathons = [
  {
    id: 1,
    title: "AI Innovation Challenge 2024",
    organizer: "TechCorp",
    deadline: "2024-12-15",
    prize: "$50,000",
    location: "Online",
    category: "hackathon",
    url: "https://example.com/hackathon1",
    collected_at: "2024-08-30T10:00:00Z",
    status: "verified"
  },
  {
    id: 2,
    title: "Blockchain Builders Hackathon",
    organizer: "CryptoFoundation",
    deadline: "2024-11-20",
    prize: "$25,000",
    location: "San Francisco, CA",
    category: "hackathon",
    url: "https://example.com/hackathon2",
    collected_at: "2024-08-30T11:00:00Z",
    status: "verified"
  }
];

export const mockJobs = [
  {
    id: 3,
    title: "Senior Frontend Developer",
    company: "InnovateTech",
    location: "Remote",
    salary: "$120,000 - $150,000",
    type: "Full-time",
    category: "job",
    url: "https://example.com/job1",
    collected_at: "2024-08-30T09:30:00Z",
    status: "verified"
  },
  {
    id: 4,
    title: "Data Scientist Intern",
    company: "DataCorp",
    location: "New York, NY",
    salary: "$25/hour",
    type: "Internship",
    category: "job",
    url: "https://example.com/job2",
    collected_at: "2024-08-30T10:15:00Z",
    status: "pending"
  }
];

export const mockCompetitions = [
  {
    id: 5,
    title: "Global Coding Championship",
    organizer: "CodeMasters",
    deadline: "2024-10-30",
    prize: "$10,000",
    category: "competition",
    url: "https://example.com/comp1",
    collected_at: "2024-08-30T08:45:00Z",
    status: "verified"
  }
];

export const mockCertifications = [
  {
    id: 6,
    title: "AWS Cloud Practitioner",
    provider: "Amazon Web Services",
    duration: "3 months",
    level: "Beginner",
    category: "certification",
    url: "https://example.com/cert1",
    collected_at: "2024-08-30T12:00:00Z",
    status: "verified"
  },
  {
    id: 7,
    title: "Google Analytics Certified",
    provider: "Google",
    duration: "2 weeks",
    level: "Intermediate",
    category: "certification",
    url: "https://example.com/cert2",
    collected_at: "2024-08-30T13:00:00Z",
    status: "verified"
  }
];

export const getAllMockData = () => [
  ...mockHackathons,
  ...mockJobs,
  ...mockCompetitions,
  ...mockCertifications
];