import OpenAI from 'openai';
import { supabase } from './supabase';

// Get OpenAI client with settings from superadmin profile
async function getOpenAIClient() {
  const { data: adminSettings } = await supabase
    .from('profiles')
    .select('settings')
    .eq('role', 'superadmin')
    .limit(1)
    .single();

  if (!adminSettings?.settings?.openai?.api_key) {
    throw new Error('OpenAI API key not configured. Please contact an administrator.');
  }

  return {
    client: new OpenAI({
      apiKey: adminSettings.settings.openai.api_key,
      dangerouslyAllowBrowser: true
    }),
    model: adminSettings.settings.openai.model || 'gpt-4'
  };
}

// Generate AI feedback and tasks
export const generateTasks = async (entry: {
  accomplished: string;
  working_on: string;
  blockers: string;
  goals: string;
}, userId: string) => {
  try {
    const { client, model } = await getOpenAIClient();

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an experienced co-founder and tech lead providing strategic guidance and support. Your role is to:

1. Analyze updates thoughtfully and provide specific, actionable feedback
2. Ask probing questions to uncover deeper insights
3. Challenge assumptions constructively
4. Share relevant experience and patterns
5. Help identify risks and opportunities
6. Break down complex problems into manageable steps
7. Suggest concrete next actions

Your response should follow this format:

FEEDBACK
[Provide thoughtful analysis that:
- Acknowledges specific achievements
- Identifies patterns and insights
- Highlights potential risks or missed opportunities 
- Suggests strategic improvements
- Connects current work to bigger picture goals
- Offers specific actionable advice]

TASKS
[Generate 3-5 high-impact tasks in this exact format:]

{
  "tasks": [
    {
      "title": "Clear task title",
      "description": "Detailed description of what needs to be done and why",
      "priority": "high/medium/low",
      "estimated_hours": 2,
      "task_type": "Feature Development/Bug Fix/Documentation/Research/Design/Planning/Marketing/Sales/Customer Support/Infrastructure/Testing/Analytics/Process Improvement/Team Coordination/Other",
      "implementation_tips": [
        "Specific actionable tip 1",
        "Specific actionable tip 2",
        "Specific actionable tip 3"
      ],
      "potential_challenges": [
        "Challenge 1 with mitigation strategy",
        "Challenge 2 with mitigation strategy",
        "Challenge 3 with mitigation strategy"
      ],
      "success_metrics": [
        "Concrete measurable metric 1",
        "Concrete measurable metric 2",
        "Concrete measurable metric 3"
      ],
      "resources": [
        {
          "title": "Resource Title",
          "url": "https://example.com",
          "type": "article/video/tool",
          "description": "Brief description"
        }
      ],
      "learning_resources": [
        {
          "title": "Resource Title",
          "url": "https://example.com",
          "type": "course/tutorial/guide",
          "platform": "Platform name",
          "description": "Brief description"
        }
      ],
      "tools": [
        {
          "name": "Tool Name",
          "url": "https://example.com",
          "category": "Category",
          "description": "Brief description"
        }
      ]
    }
  ]
}`
        },
        {
          role: "user",
          content: `Please analyze this standup update and provide strategic feedback and tasks:

${entry.accomplished ? 'Accomplished: ' + entry.accomplished + '\n' : ''}${entry.working_on ? 'Working On: ' + entry.working_on + '\n' : ''}${entry.blockers ? 'Blockers: ' + entry.blockers + '\n' : ''}${entry.goals ? 'Goals: ' + entry.goals : ''}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response generated');
    }

    // Split into feedback and tasks sections
    const [feedbackSection, tasksSection] = content.split('\n\nTASKS\n');
    const feedback = feedbackSection.replace('FEEDBACK\n', '').trim();
    
    // Parse tasks JSON
    try {
      const tasksJson = tasksSection.trim();
      const { tasks } = JSON.parse(tasksJson);

      // Validate and transform tasks
      const validatedTasks = tasks.map((task: any) => ({
        ...task,
        status: 'pending',
        implementation_tips: task.implementation_tips || [],
        potential_challenges: task.potential_challenges || [],
        success_metrics: task.success_metrics || [],
        resources: task.resources || [],
        learning_resources: task.learning_resources || [],
        tools: task.tools || []
      }));

      return {
        feedback,
        tasks: validatedTasks
      };
    } catch (e) {
      console.error('Error parsing tasks JSON:', e);
      return {
        feedback,
        tasks: []
      };
    }
  } catch (error: any) {
    console.error('Error generating tasks:', error);
    throw new Error(error.message || 'Failed to generate tasks');
  }
};