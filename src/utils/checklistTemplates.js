/**
 * Predefined checklist items for different event categories
 */
const CHECKLIST_TEMPLATES = {
  conference: [
    { title: "Speaker Onboarding", description: "Add profiles for all keynote and session speakers.", category: "Setup" },
    { title: "Ticketing & Tiers", description: "Set up early bird, standard, and VIP ticket tiers.", category: "Setup" },
    { title: "Sponsor Packages", description: "Finalize sponsor logos and virtual booth setups.", category: "Marketing" },
    { title: "Session Schedule", description: "Create detailed agenda with tracks and rooms.", category: "Logistics" },
    { title: "Networking Hub", description: "Configure attendee matchmaking and networking lounges.", category: "Engagement" },
  ],
  concert: [
    { title: "Artist Lineup", description: "Publish the performing artist lineup and set times.", category: "Setup" },
    { title: "Merch Store", description: "Set up the online store for event merchandise.", category: "Setup" },
    { title: "Teaser Campaign", description: "Launch artist teaser videos on social media.", category: "Marketing" },
    { title: "Stage & AV Specs", description: "Finalize lighting, sound, and stage layout requirements.", category: "Logistics" },
    { title: "Fan Q&A", description: "Set up live Q&A sessions or meet & greets.", category: "Engagement" },
  ],
  party: [
    { title: "Guest List", description: "Import and finalize the VIP and general guest list.", category: "Setup" },
    { title: "Theme & Decor", description: "Finalize the party theme, colors, and decorations.", category: "Setup" },
    { title: "Digital Invitations", description: "Send out customized digital invites with RSVPs.", category: "Marketing" },
    { title: "Catering & Menu", description: "Confirm food menu and drink selections.", category: "Logistics" },
    { title: "Playlist & Games", description: "Curate the music playlist and prepare party games.", category: "Engagement" },
  ],
  wedding: [
    { title: "Guest Accommodations", description: "Set up hotel blocks and travel information.", category: "Setup" },
    { title: "Gift Registry", description: "Link the couple's gift registries.", category: "Setup" },
    { title: "Wedding Website", description: "Publish the wedding story, schedule, and FAQs.", category: "Marketing" },
    { title: "Seating Chart", description: "Finalize the seating arrangements for the reception.", category: "Logistics" },
    { title: "Photo Booth & Hashtag", description: "Set up the photo booth and promote the wedding hashtag.", category: "Engagement" },
  ],
  default: [
    { title: "Event Branding", description: "Upload event banner, logo and set primary theme colors.", category: "Setup" },
    { title: "Ticket Configuration", description: "Set up free and paid ticket tiers with availability limits.", category: "Setup" },
    { title: "Social Promotion", description: "Connect social media handles and schedule announcements.", category: "Marketing" },
    { title: "Engagement Tools", description: "Prepare session polls and interactive games.", category: "Engagement" },
    { title: "Venue & Schedule", description: "Finalize event location and detailed session timeline.", category: "Logistics" }
  ]
};

module.exports = CHECKLIST_TEMPLATES;
