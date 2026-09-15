const prisma = require('../utils/prisma');
const { createAlert } = require('./alertController');

const getSponsors = async (req, res) => {
  try {
    // Fetch all users with role 'SPONSOR'
    const sponsorUsers = await prisma.user.findMany({ where: { role: 'SPONSOR' } });
    
    // Ensure every sponsor user has at least one Sponsor record
    for (const user of sponsorUsers) {
        const existingPledge = await prisma.sponsor.findFirst({ where: { userId: user.id } });
        if (!existingPledge) {
            await prisma.sponsor.create({
                data: {
                    name: user.companyName || user.name || 'Unknown Sponsor',
                    tier: 'Silver',
                    userId: user.id,
                    passesAllocated: 1,
                    paymentStatus: 'Pending',
                    brandingCompleted: false,
                    boothAllocated: false
                }
            });
        }
    }

    const sponsors = await prisma.sponsor.findMany({ include: { event: true } });
    res.json(sponsors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sponsors', details: error.message });
  }
};

const createSponsor = async (req, res) => {
  try {
    const { name, tier, eventId } = req.body;
    
    // Default to user's company or name if not provided
    let sponsorName = name;
    if (!sponsorName && req.user && req.user.id) {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (user) {
            sponsorName = user.companyName || user.name || 'Unknown Sponsor';
        } else {
            sponsorName = 'Unknown Sponsor';
        }
    }

    // Determine passes based on tier
    let passes = 0;
    if (tier === 'Platinum') passes = 10;
    else if (tier === 'Gold') passes = 3;
    else if (tier === 'Silver') passes = 1;

    const sponsor = await prisma.sponsor.create({
      data: { 
          name: sponsorName, 
          tier: tier || 'Silver',
          eventId: eventId ? parseInt(eventId) : null,
          userId: req.user ? req.user.id : null, // If authenticated
          passesAllocated: passes,
          paymentStatus: 'Pending',
          brandingCompleted: false,
          boothAllocated: false
      }
    });

    const io = req.app.get('io');
    
    // Notify about new sponsorship pledge
    await createAlert('INFO', `New ${tier} Sponsorship pledged by ${sponsorName}`, 'SYSTEM', io);

    // Real-time update (if io is configured)
    if (io) {
        io.emit('sponsor_added', sponsor);
    }

    res.status(201).json(sponsor);
  } catch (error) {
    console.error('Error creating sponsor:', error);
    res.status(500).json({ error: 'Failed to create sponsor', details: error.message });
  }
};

const updateSponsorMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    const metrics = req.body; 
    
    if (metrics.eventId) {
        metrics.eventId = parseInt(metrics.eventId);
    }

    // Don't update the relation object directly if passed from frontend
    delete metrics.event;

    const updated = await prisma.sponsor.update({
      where: { id: parseInt(id) },
      data: metrics
    });
    
    const io = req.app.get('io');
    if (io) {
        io.emit('sponsorship_updated', updated);
    }
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sponsor metrics', details: error.message });
  }
};

const getMySponsorships = async (req, res) => {
  try {
    const sponsorships = await prisma.sponsor.findMany({
      where: { userId: req.user.id },
      include: { event: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(sponsorships);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sponsorships' });
  }
};

const deleteSponsorship = async (req, res) => {
  try {
    const { id } = req.params;
    
    // We optionally verify the sponsor belongs to the user, or if admin is deleting
    const sponsor = await prisma.sponsor.findUnique({ where: { id: parseInt(id) } });
    if (!sponsor) {
        return res.status(404).json({ error: 'Sponsorship not found' });
    }

    if (req.user.role !== 'ADMIN' && sponsor.userId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized to delete this sponsorship' });
    }

    await prisma.sponsor.delete({
      where: { id: parseInt(id) }
    });

    const io = req.app.get('io');
    if (io) {
        io.emit('sponsorship_deleted', { id: parseInt(id) });
    }

    res.json({ message: 'Sponsorship deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sponsorship', details: error.message });
  }
};

module.exports = {
  getSponsors,
  createSponsor,
  updateSponsorMetrics,
  getMySponsorships,
  deleteSponsorship
};
