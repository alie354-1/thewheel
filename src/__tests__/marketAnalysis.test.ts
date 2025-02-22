import { generateMarketAnalysis, generateMarketSuggestions } from '../lib/openai';

describe('Market Analysis', () => {
  // Test data for B2B market
  const b2bQuestionnaire = {
    target_audience: "Enterprise companies and mid-sized businesses",
    sales_channels: "Direct sales team and channel partnerships",
    pricing_model: "Enterprise licensing with annual contracts",
    customer_type: "IT decision makers and department heads",
    integration_needs: "Enterprise systems like SAP, Oracle, and Salesforce"
  };

  const b2bIdea = {
    title: "Enterprise AI workflow automation platform",
    description: "AI-powered platform for automating enterprise business processes",
    solution_concept: "Enterprise SaaS with AI capabilities",
    target_audience: "Large enterprises and corporations",
    sales_channels: "Enterprise sales and strategic partnerships",
    pricing_model: "Annual enterprise licensing",
    customer_type: "Fortune 500 companies",
    integration_needs: "Major enterprise systems and legacy infrastructure"
  };

  // B2B Market Analysis Tests
  describe('generateMarketAnalysis for B2B', () => {
    it('should generate B2B market analysis with valid input', async () => {
      const result = await generateMarketAnalysis(b2bQuestionnaire);
      
      // Verify response structure
      expect(result).toHaveProperty('market_insights');
      expect(result.market_insights).toHaveProperty('customer_profiles');
      expect(result.market_insights).toHaveProperty('early_adopters');
      expect(result.market_insights).toHaveProperty('sales_channels');
      expect(result.market_insights).toHaveProperty('pricing_insights');
      expect(result.market_insights).toHaveProperty('integration_recommendations');
      expect(result.market_insights).toHaveProperty('market_size_estimates');
      expect(result.market_insights).toHaveProperty('competition_analysis');

      // Verify arrays have exactly 3 items each
      expect(result.market_insights.customer_profiles).toHaveLength(3);
      expect(result.market_insights.early_adopters).toHaveLength(3);
      expect(result.market_insights.sales_channels).toHaveLength(3);
      expect(result.market_insights.pricing_insights).toHaveLength(3);
      expect(result.market_insights.integration_recommendations).toHaveLength(3);
      expect(result.market_insights.market_size_estimates).toHaveLength(3);
      expect(result.market_insights.competition_analysis).toHaveLength(3);

      // Verify B2B-specific content
      expect(result.market_insights.customer_profiles.every(profile => 
        /enterprise|business|company|corporate|b2b/i.test(profile)
      )).toBe(true);

      expect(result.market_insights.sales_channels.every(channel => 
        /sales|partner|direct|channel|enterprise/i.test(channel)
      )).toBe(true);
    });

    it('should handle empty B2B input gracefully', async () => {
      const emptyQuestionnaire = {
        target_audience: "",
        sales_channels: "",
        pricing_model: "",
        customer_type: "",
        integration_needs: ""
      };

      const result = await generateMarketAnalysis(emptyQuestionnaire);
      
      // Verify arrays still have 3 items each
      expect(result.market_insights.customer_profiles).toHaveLength(3);
      expect(result.market_insights.early_adopters).toHaveLength(3);
      expect(result.market_insights.sales_channels).toHaveLength(3);
      expect(result.market_insights.pricing_insights).toHaveLength(3);
      expect(result.market_insights.integration_recommendations).toHaveLength(3);
      expect(result.market_insights.market_size_estimates).toHaveLength(3);
      expect(result.market_insights.competition_analysis).toHaveLength(3);
    });
  });

  // B2B Market Suggestions Tests
  describe('generateMarketSuggestions for B2B', () => {
    it('should generate B2B market suggestions with valid input', async () => {
      const result = await generateMarketSuggestions(b2bIdea);
      
      // Verify response structure
      expect(result).toHaveProperty('target_audience');
      expect(result).toHaveProperty('sales_channels');
      expect(result).toHaveProperty('pricing_model');
      expect(result).toHaveProperty('customer_type');
      expect(result).toHaveProperty('integration_needs');

      // Verify arrays contain exactly 5 suggestions each
      expect(result.target_audience).toHaveLength(5);
      expect(result.sales_channels).toHaveLength(5);
      expect(result.pricing_model).toHaveLength(5);
      expect(result.customer_type).toHaveLength(5);
      expect(result.integration_needs).toHaveLength(5);

      // Verify B2B-specific content
      expect(result.target_audience.every(audience => 
        /enterprise|business|company|corporate|b2b/i.test(audience)
      )).toBe(true);

      expect(result.sales_channels.every(channel => 
        /sales|partner|direct|channel|enterprise/i.test(channel)
      )).toBe(true);

      expect(result.pricing_model.every(model => 
        /enterprise|license|contract|annual|subscription/i.test(model)
      )).toBe(true);
    });

    it('should handle partial B2B input', async () => {
      const partialIdea = {
        title: b2bIdea.title,
        description: b2bIdea.description,
        solution_concept: b2bIdea.solution_concept
      };

      const result = await generateMarketSuggestions(partialIdea);
      
      // Should still return all suggestion categories with 5 items each
      expect(result.target_audience).toHaveLength(5);
      expect(result.sales_channels).toHaveLength(5);
      expect(result.pricing_model).toHaveLength(5);
      expect(result.customer_type).toHaveLength(5);
      expect(result.integration_needs).toHaveLength(5);
    });
  });

  // B2B Integration Tests
  describe('B2B Market Analysis Integration', () => {
    it('should work end-to-end for B2B', async () => {
      // First get market suggestions
      const suggestions = await generateMarketSuggestions(b2bIdea);
      expect(suggestions).toBeDefined();

      // Use suggestions to generate analysis
      const analysis = await generateMarketAnalysis({
        target_audience: suggestions.target_audience[0],
        sales_channels: suggestions.sales_channels[0],
        pricing_model: suggestions.pricing_model[0],
        customer_type: suggestions.customer_type[0],
        integration_needs: suggestions.integration_needs[0]
      });

      expect(analysis).toBeDefined();
      expect(analysis.market_insights).toBeDefined();

      // Verify B2B-specific insights
      expect(analysis.market_insights.customer_profiles.some(profile => 
        /enterprise|business/i.test(profile)
      )).toBe(true);

      expect(analysis.market_insights.sales_channels.some(channel =>
        /sales|partner/i.test(channel)
      )).toBe(true);
    });
  });
});