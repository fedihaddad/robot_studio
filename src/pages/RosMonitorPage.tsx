import React, { useState, useEffect } from 'react';
import { ROS2Topic } from '../types';

interface RosMonitorPageProps {
  topics: ROS2Topic[];
  isLoading: boolean;
}

const RosMonitorPage: React.FC<RosMonitorPageProps> = ({ topics, isLoading }) => {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

  // Important topics for AXEL
  const importantTopics = [
    '/servo/cmd',
    '/audio/input',
    '/ia/decision',
    '/robot/state',
    '/cmd_vel',
  ];

  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(filter.toLowerCase()) ||
    topic.type.toLowerCase().includes(filter.toLowerCase())
  );

  const priorityTopics = filteredTopics.filter(t => importantTopics.includes(t.name));
  const otherTopics = filteredTopics.filter(t => !importantTopics.includes(t.name));

  const formatJson = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getTopicIcon = (topicName: string): string => {
    if (topicName.includes('servo')) return '🎮';
    if (topicName.includes('audio')) return '🎵';
    if (topicName.includes('ia') || topicName.includes('decision')) return '🧠';
    if (topicName.includes('state') || topicName.includes('status')) return '📊';
    if (topicName.includes('cmd_vel')) return '⏩';
    if (topicName.includes('camera') || topicName.includes('image')) return '📷';
    return '📡';
  };

  return (
    <div className="p-6 md:p-8 space-y-6" style={{ background: 'var(--axel-bg)', color: 'var(--axel-text)' }}>
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold axel-gradient-text mb-2">ROS2 Monitor</h1>
        <p className="axel-muted">Real-time topic monitoring and data inspection</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="axel-surface rounded-2xl p-4 border text-center" style={{ borderColor: 'var(--axel-border)' }}>
          <p className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-300">{topics.length}</p>
          <p className="text-sm axel-muted">Total Topics</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <p className="text-3xl font-bold text-green-400">{priorityTopics.length}</p>
          <p className="text-sm text-gray-400">Priority Topics</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <p className="text-3xl font-bold text-yellow-400">
            {topics.filter(t => t.lastUpdate && Date.now() - t.lastUpdate < 5000).length}
          </p>
          <p className="text-sm text-gray-400">Active (5s)</p>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search topics..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Priority Topics */}
      {priorityTopics.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-yellow-400">⭐ Important Topics</h2>
          <div className="space-y-2">
            {priorityTopics.map((topic) => (
              <TopicCard
                key={topic.name}
                topic={topic}
                isExpanded={expandedTopic === topic.name}
                onToggle={() =>
                  setExpandedTopic(expandedTopic === topic.name ? null : topic.name)
                }
                icon={getTopicIcon(topic.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Topics */}
      {otherTopics.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">All Topics ({otherTopics.length})</h2>
          <div className="space-y-2">
            {otherTopics.map((topic) => (
              <TopicCard
                key={topic.name}
                topic={topic}
                isExpanded={expandedTopic === topic.name}
                onToggle={() =>
                  setExpandedTopic(expandedTopic === topic.name ? null : topic.name)
                }
                icon={getTopicIcon(topic.name)}
              />
            ))}
          </div>
        </div>
      )}

      {filteredTopics.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          {isLoading ? 'Loading topics...' : 'No topics found'}
        </div>
      )}
    </div>
  );
};

interface TopicCardProps {
  topic: ROS2Topic;
  isExpanded: boolean;
  onToggle: () => void;
  icon: string;
}

const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  isExpanded,
  onToggle,
  icon,
}) => {
  const isActive = topic.lastUpdate && Date.now() - topic.lastUpdate < 5000;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 hover:bg-gray-700 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <span className="text-xl">{icon}</span>
          <div className="flex-1">
            <p className="font-semibold text-white">{topic.name}</p>
            <p className="text-xs text-gray-400">{topic.type}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isActive && (
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
          <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-700 p-4 bg-gray-900">
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Message Type</p>
              <p className="text-sm font-mono text-blue-400">{topic.type}</p>
            </div>

            {topic.latestMessage && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Latest Message</p>
                <pre className="text-xs text-green-400 font-mono bg-black rounded p-2 overflow-auto max-h-40">
                  {JSON.stringify(topic.latestMessage, null, 2)}
                </pre>
              </div>
            )}

            {topic.lastUpdate && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Last Update</p>
                <p className="text-sm text-gray-300">
                  {new Date(topic.lastUpdate).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RosMonitorPage;
