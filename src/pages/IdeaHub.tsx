import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  FileSpreadsheet,
  Coins,
  Rocket,
  BarChart3,
  Library,
  Users,
  CheckCircle,
  StickyNote,
  Plus,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

interface ToolCard {
  icon: React.ElementType;
  title: string;
  description: string;
  action: {
    text: string;
    href: string;
  };
}

export default function IdeaHub() {
  const tools: ToolCard[] = [
    {
      icon: Lightbulb,
      title: 'Idea Flow',
      description: 'Refine your startup ideas into buildable concepts with AI guidance.',
      action: {
        text: 'Start Ideation',
        href: '/idea-hub/flow'
      }
    },
    {
      icon: Bot,
      title: 'AI Co-founder Bot',
      description: 'Bounce ideas and get instant feedback from our AI assistant.',
      action: {
        text: 'Start Discussion',
        href: '/idea-hub/ai-discussion'
      }
    },
    {
      icon: FileSpreadsheet,
      title: 'Idea Canvas',
      description: 'Structure and visualize your concept using our interactive canvas.',
      action: {
        text: 'Open Canvas',
        href: '/idea-hub/canvas'
      }
    },
    {
      icon: BarChart3,
      title: 'Market Research',
      description: 'Analyze market size and competition with our research tools.',
      action: {
        text: 'Research Now',
        href: '/idea-hub/market-research'
      }
    },
    {
      icon: Coins,
      title: 'Business Model Builder',
      description: 'Define your revenue streams and cost structures.',
      action: {
        text: 'Build Model',
        href: '/idea-hub/business-model'
      }
    },
    {
      icon: Rocket,
      title: 'Pitch Deck Creator',
      description: 'Create compelling investor presentations with our templates.',
      action: {
        text: 'Create Deck',
        href: '/idea-hub/pitch-deck'
      }
    }
  ];

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Idea Hub</h1>
            <p className="mt-1 text-sm text-gray-500">
              Transform your ideas into successful startups
            </p>
          </div>
          <Link
            to="/idea-hub/flow"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Idea
          </Link>
        </div>

        {/* Featured Tool */}
        <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 sm:p-10">
            <div className="sm:flex sm:items-start sm:justify-between">
              <div className="sm:flex-1">
                <h2 className="text-xl font-semibold text-white sm:text-2xl">
                  New: AI-Powered Idea Flow
                </h2>
                <p className="mt-2 text-sm text-indigo-100 sm:text-base">
                  Take your startup ideas from concept to execution with our new guided workflow.
                  Get AI feedback at every step and refine your ideas into buildable concepts.
                </p>
                <div className="mt-4">
                  <Link
                    to="/idea-hub/flow"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-600 bg-white hover:bg-indigo-50"
                  >
                    Try Idea Flow
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-6">
                <Lightbulb className="h-12 w-12 text-white opacity-75" />
              </div>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-5">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <tool.icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">
                    {tool.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">{tool.description}</p>
                <Link
                  to={tool.action.href}
                  className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
                >
                  {tool.action.text}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}