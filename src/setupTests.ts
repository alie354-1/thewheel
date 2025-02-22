import '@testing-library/jest-dom';

// Mock Supabase client
jest.mock('./lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: {
              settings: {
                openai: {
                  api_key: 'test-key',
                  model: 'gpt-4'
                }
              }
            },
            error: null
          })
        }))
      }))
    })),
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn()
    }
  }
}));

// Mock OpenAI with B2B-specific responses
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  market_insights: {
                    customer_profiles: [
                      'Enterprise corporations with 1000+ employees',
                      'Mid-sized B2B technology companies',
                      'Corporate IT departments in Fortune 500 companies'
                    ],
                    early_adopters: [
                      'Forward-thinking enterprise tech leaders',
                      'Digital transformation teams in large companies',
                      'Innovation departments in B2B companies'
                    ],
                    sales_channels: [
                      'Enterprise direct sales team',
                      'Strategic technology partnerships',
                      'B2B solution providers network'
                    ],
                    pricing_insights: [
                      'Enterprise-wide licensing model',
                      'Annual contract value optimization',
                      'Volume-based corporate pricing tiers'
                    ],
                    integration_recommendations: [
                      'Enterprise CRM systems integration',
                      'Corporate SSO implementation',
                      'Legacy system compatibility layer'
                    ],
                    market_size_estimates: [
                      'Global enterprise market: $50B+',
                      'B2B technology segment: $15B',
                      'Corporate automation sector: $8B'
                    ],
                    competition_analysis: [
                      'Enterprise software incumbents',
                      'Corporate solution providers',
                      'B2B technology startups'
                    ]
                  }
                })
              }
            }]
          })
        }
      }
    }))
  };
});

// Mock process.env
process.env.NODE_ENV = 'test';

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});