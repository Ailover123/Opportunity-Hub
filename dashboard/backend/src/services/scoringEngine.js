/**
 * Scoring Engine for OpportunityHub
 * Deterministic system for ranking opportunities based on user profile.
 */

const SYNONYM_MAP = {
    'reactjs': 'react',
    'ml': 'machine learning',
    'ai': 'artificial intelligence',
    'nodejs': 'node',
    'js': 'javascript',
    'cpp': 'c++',
    'python3': 'python',
    'intern': 'internship',
    'hack': 'hackathon'
};

const PLATFORM_WEIGHTS = {
    'unstop': 0.9,
    'devpost': 0.8,
    'kaggle': 0.7,
    'indeed': 0.6,
    'default': 0.5
};

class ScoringEngine {
    constructor(userProfile) {
        this.profile = userProfile || { skills: [], interests: [] };
        this.normalizedSkills = this.normalizeList(this.profile.skills);
        this.normalizedInterests = this.normalizeList(this.profile.interests);
    }

    normalize(text) {
        if (!text) return '';
        let normalized = text.toLowerCase().trim().replace(/[^a-z0-9+#]/g, '');
        return SYNONYM_MAP[normalized] || normalized;
    }

    normalizeList(list) {
        if (!Array.isArray(list)) return [];
        return list.map(item => this.normalize(item)).filter(item => item !== '');
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    calculateScore(opportunity) {
        const now = new Date();
        const deadlineDate = opportunity.deadline ? new Date(opportunity.deadline) : null;
        
        // --- 1. Filter: Expired ---
        if (deadlineDate && deadlineDate < now) {
            return null; // Exclude from ranking
        }

        // --- 2. Skill Match (S) ---
        let skillScore = 0;
        const reasons = [];
        const oppTitle = this.normalize(opportunity.title);
        const oppOrg = this.normalize(opportunity.organization);
        const oppCategory = this.normalize(opportunity.category);

        for (const skill of this.normalizedSkills) {
            if (oppTitle.includes(skill) || oppCategory.includes(skill)) {
                skillScore = 1.0;
                reasons.push({ type: 'skill', message: `Perfect match for your '${skill}' skill` });
                break;
            }
        }

        // --- 3. Deadline Urgency (D) ---
        let deadlineScore = 0;
        if (deadlineDate) {
            const daysRemaining = (deadlineDate - now) / (1000 * 60 * 60 * 24);
            deadlineScore = this.clamp(1 - (daysRemaining / 14), 0, 1);
            
            if (daysRemaining <= 3) {
                reasons.push({ type: 'deadline', message: `Closing soon (in ${Math.round(daysRemaining)} days!)` });
            } else if (daysRemaining <= 7) {
                reasons.push({ type: 'deadline', message: `Deadline approaching next week` });
            }
        } else {
            deadlineScore = 0.3; // Default neutral score for missing deadlines
        }

        // --- 4. Platform Activity (P) ---
        const platformKey = opportunity.source ? opportunity.source.toLowerCase() : 'default';
        const platformScore = PLATFORM_WEIGHTS[platformKey] || PLATFORM_WEIGHTS['default'];
        
        if (platformScore >= 0.8) {
            reasons.push({ type: 'platform', message: 'High-activity platform' });
        }

        // --- 5. Final Calculation ---
        // Score = 10 * ((S * 0.5) + (D * 0.3) + (P * 0.2))
        const finalScore = 10 * ((skillScore * 0.5) + (deadlineScore * 0.3) + (platformScore * 0.2));

        return {
            ...opportunity,
            score: parseFloat(finalScore.toFixed(1)),
            reasons: reasons
        };
    }

    rank(opportunities) {
        if (!this.profile.skills.length && !this.profile.interests.length) {
            return {
                isRanked: false,
                fallbackMessage: "Complete your profile to unlock personalized ranking.",
                data: opportunities.sort((a, b) => new Date(b.collected_at) - new Date(a.collected_at)).slice(0, 10)
            };
        }

        const ranked = opportunities
            .map(opp => this.calculateScore(opp))
            .filter(opp => opp !== null) // Remove expired
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return new Date(b.collected_at) - new Date(a.collected_at); // Tie-breaker
            })
            .slice(0, 50);

        return {
            isRanked: true,
            data: ranked
        };
    }
}

module.exports = ScoringEngine;
