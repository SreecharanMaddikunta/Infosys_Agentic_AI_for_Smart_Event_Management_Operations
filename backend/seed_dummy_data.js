const prisma = require('./src/utils/prisma');

const venues = [
    { name: "Tech Hub Auditorium", capacity: 500, location: "Building A", facilities: JSON.stringify(["Projector", "Wi-Fi", "PA System"]), status: "AVAILABLE" },
    { name: "Innovation Lab 1", capacity: 50, location: "Building B", facilities: JSON.stringify(["Whiteboard", "Wi-Fi"]), status: "AVAILABLE" },
    { name: "Grand Conference Room", capacity: 200, location: "Main HQ", facilities: JSON.stringify(["Video Conferencing", "Wi-Fi", "Coffee Machine"]), status: "AVAILABLE" },
    { name: "AI Research Center", capacity: 150, location: "Building C", facilities: JSON.stringify(["Workstations", "Wi-Fi", "Screens"]), status: "AVAILABLE" },
    { name: "Startup Garage", capacity: 100, location: "Building D", facilities: JSON.stringify(["Wi-Fi", "Lounge", "Projector"]), status: "AVAILABLE" },
    { name: "Executive Boardroom", capacity: 20, location: "HQ Level 5", facilities: JSON.stringify(["Telepresence", "Wi-Fi", "Catering"]), status: "AVAILABLE" },
    { name: "Cloud Computing Lab", capacity: 80, location: "Building E", facilities: JSON.stringify(["Terminals", "Wi-Fi"]), status: "AVAILABLE" },
    { name: "Cybersecurity Bunker", capacity: 60, location: "Basement", facilities: JSON.stringify(["Secure Net", "Screens"]), status: "AVAILABLE" },
    { name: "Open Source Cafe", capacity: 120, location: "Campus Square", facilities: JSON.stringify(["Wi-Fi", "Food", "Stage"]), status: "AVAILABLE" },
    { name: "Data Science Hall", capacity: 300, location: "Building F", facilities: JSON.stringify(["Projector", "Wi-Fi", "Sound System"]), status: "AVAILABLE" },
    { name: "Robotics Workshop", capacity: 40, location: "Building G", facilities: JSON.stringify(["Tools", "3D Printers", "Wi-Fi"]), status: "AVAILABLE" },
    { name: "Virtual Reality Dome", capacity: 25, location: "Building H", facilities: JSON.stringify(["VR Headsets", "Wi-Fi"]), status: "AVAILABLE" },
    { name: "Design Thinking Studio", capacity: 35, location: "Building I", facilities: JSON.stringify(["Whiteboards", "Sticky Notes", "Wi-Fi"]), status: "AVAILABLE" },
    { name: "Blockchain Center", capacity: 90, location: "Building J", facilities: JSON.stringify(["Wi-Fi", "Screens"]), status: "AVAILABLE" },
    { name: "Main Stadium", capacity: 5000, location: "Campus Ground", facilities: JSON.stringify(["PA System", "Jumbotron", "Seating"]), status: "AVAILABLE" }
];

const speakers = [
    { name: "Sundar Pichai", email: "sundar@example.com", bio: "CEO of Alphabet and Google", expertise: JSON.stringify(["Search", "AI", "Leadership"]), availability: JSON.stringify(["09:00-11:00", "14:00-16:00"]), pastRating: 4.9 },
    { name: "Satya Nadella", email: "satya@example.com", bio: "CEO of Microsoft", expertise: JSON.stringify(["Cloud Computing", "AI", "Enterprise"]), availability: JSON.stringify(["10:00-12:00"]), pastRating: 4.9 },
    { name: "Narayana Murthy", email: "narayana@example.com", bio: "Founder of Infosys", expertise: JSON.stringify(["IT Services", "Entrepreneurship", "Values"]), availability: JSON.stringify(["13:00-15:00"]), pastRating: 4.8 },
    { name: "Nandan Nilekani", email: "nandan@example.com", bio: "Co-founder of Infosys, Architect of Aadhaar", expertise: JSON.stringify(["Public Infrastructure", "Digital Identity", "Tech Policy"]), availability: JSON.stringify(["09:00-12:00"]), pastRating: 4.9 },
    { name: "Kiran Mazumdar-Shaw", email: "kiran@example.com", bio: "Founder of Biocon", expertise: JSON.stringify(["Biotech", "Entrepreneurship", "Innovation"]), availability: JSON.stringify(["11:00-13:00"]), pastRating: 4.7 },
    { name: "Ratan Tata", email: "ratan@example.com", bio: "Former Chairman of Tata Sons", expertise: JSON.stringify(["Leadership", "Philanthropy", "Business Strategy"]), availability: JSON.stringify(["14:00-16:00"]), pastRating: 5.0 },
    { name: "Azim Premji", email: "azim@example.com", bio: "Former Chairman of Wipro", expertise: JSON.stringify(["IT Industry", "Philanthropy", "Education"]), availability: JSON.stringify(["10:00-11:00"]), pastRating: 4.8 },
    { name: "Shiv Nadar", email: "shiv@example.com", bio: "Founder of HCL Technologies", expertise: JSON.stringify(["Hardware", "IT Services", "Education"]), availability: JSON.stringify(["15:00-17:00"]), pastRating: 4.7 },
    { name: "Indra Nooyi", email: "indra@example.com", bio: "Former CEO of PepsiCo", expertise: JSON.stringify(["Corporate Strategy", "Leadership", "Global Business"]), availability: JSON.stringify(["09:00-11:00"]), pastRating: 4.9 },
    { name: "Sridhar Vembu", email: "sridhar@example.com", bio: "Founder of Zoho", expertise: JSON.stringify(["SaaS", "Bootstrapping", "Rural Tech"]), availability: JSON.stringify(["13:00-16:00"]), pastRating: 4.8 },
    { name: "Girish Mathrubootham", email: "girish@example.com", bio: "Founder of Freshworks", expertise: JSON.stringify(["SaaS", "Customer Success", "Startup Growth"]), availability: JSON.stringify(["14:00-15:00"]), pastRating: 4.7 },
    { name: "Dr. A.P.J. Abdul Kalam", email: "kalam@example.com", bio: "Former President of India, Missile Man", expertise: JSON.stringify(["Aerospace", "Vision", "Education"]), availability: JSON.stringify(["10:00-12:00"]), pastRating: 5.0 },
    { name: "Vijay Shekhar Sharma", email: "vijay@example.com", bio: "Founder of Paytm", expertise: JSON.stringify(["Fintech", "Startups", "Digital Payments"]), availability: JSON.stringify(["11:00-13:00"]), pastRating: 4.5 },
    { name: "Bhavish Aggarwal", email: "bhavish@example.com", bio: "Founder of Ola", expertise: JSON.stringify(["Mobility", "EV", "AI"]), availability: JSON.stringify(["15:00-17:00"]), pastRating: 4.6 },
    { name: "Anand Mahindra", email: "anand@example.com", bio: "Chairman of Mahindra Group", expertise: JSON.stringify(["Automotive", "Business Strategy", "Social Media"]), availability: JSON.stringify(["16:00-18:00"]), pastRating: 4.8 }
];

async function seed() {
    console.log("Seeding dummy venues...");
    for (const v of venues) {
        await prisma.venue.create({ data: v });
    }
    console.log("Seeding dummy speakers...");
    for (const s of speakers) {
        await prisma.speaker.create({ data: s });
    }
    console.log("Done seeding dummy data.");
}

seed().catch(e => console.error(e)).finally(() => prisma.$disconnect());
