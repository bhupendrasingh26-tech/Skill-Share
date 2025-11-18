import React, { useMemo } from 'react';
import type { User, SkillRequest, Post } from '../types';
import { ArrowLeftIcon, UserGroupIcon as UsersIcon, FireIcon, ChartBarIcon, CheckBadgeIcon, StarIcon, TrophyIcon, BoltIcon, ShieldCheckIcon } from './IconComponents';

interface AnalyticsDashboardProps {
  user: User;
  users: User[];
  posts: Post[];
  skillRequests: SkillRequest[];
  onBack: () => void;
}

interface LeaderboardUser {
    id: string;
    name: string;
    avatarUrl: string;
    score: number;
}

interface AnalyticsData {
  peopleHelped: number;
  highDemandSkills: { skill: string; count: number }[];
  weeklyActivity: { day: string; count: number }[];
  totalTasksCompleted: number;
  currentUserXp: number;
  leaderboard: LeaderboardUser[];
  currentUserRank: number | null;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactElement<React.SVGProps<SVGSVGElement>>; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-lg flex items-start gap-4 border border-zinc-200 dark:border-zinc-700">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{backgroundColor: `${color}1A`}}>
            {React.cloneElement(icon, { className: 'w-6 h-6', style: {color} })}
        </div>
        <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{value}</p>
        </div>
    </div>
);

const Badge: React.FC<{ icon: React.ReactElement<React.SVGProps<SVGSVGElement>>; label: string; unlocked: boolean; description: string }> = ({ icon, label, unlocked, description }) => (
    <div 
        className="flex flex-col items-center text-center group relative"
        title={unlocked ? `${label}: ${description}` : `LOCKED: ${description}`}
    >
        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${unlocked ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-zinc-100 dark:bg-zinc-700'}`}>
            {React.cloneElement(icon, { className: `w-12 h-12 transition-all duration-300 ${unlocked ? 'text-amber-500' : 'text-zinc-400 dark:text-zinc-500 grayscale'}` })}
        </div>
        <p className={`mt-2 text-sm font-semibold ${unlocked ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-500 dark:text-zinc-400'}`}>{label}</p>
        {!unlocked && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 dark:text-zinc-400">LOCKED</div>}
    </div>
);


export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ user, users, posts, skillRequests, onBack }) => {
  const analyticsData: AnalyticsData = useMemo(() => {
    const acceptedRequests = skillRequests.filter(req => req.status === 'accepted');
    
    const userSkills = new Set(user.skillsOffered);
    const userCompletedRequests = acceptedRequests.filter(
      req => userSkills.has(req.skill)
    );
    const peopleHelped = new Set(userCompletedRequests.map(req => req.requesterId)).size;
    
    const calculateXp = (userPosts: Post[]): number => {
        let xp = userPosts.length * 10;
        userPosts.forEach(post => {
            xp += Math.floor(post.description.length / 10);
        });
        return xp;
    };
    
    const leaderboardData = users.map(u => {
        const postsByUser = posts.filter(p => p.author.id === u.id);
        const userXp = calculateXp(postsByUser);
        const userSkillsOffered = new Set(u.skillsOffered);
        const helpedCount = new Set(acceptedRequests.filter(req => userSkillsOffered.has(req.skill)).map(req => req.requesterId)).size;
        const score = (helpedCount * 50) + userXp;
        
        return {
            id: u.id,
            name: u.name,
            avatarUrl: u.avatarUrl,
            score,
        };
    }).sort((a, b) => b.score - a.score);

    const currentUserRank = leaderboardData.findIndex(u => u.id === user.id) + 1 || null;
    const currentUserXp = calculateXp(posts.filter(p => p.author.id === user.id));

    const skillCounts: Record<string, number> = {};
    acceptedRequests.forEach(req => {
      skillCounts[req.skill] = (skillCounts[req.skill] || 0) + 1;
    });
    const highDemandSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }));

    const weeklyActivityData = Array(7).fill(0);
    const dayLabels = Array(7).fill('');
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dayLabels[6-i] = dayFormatter.format(date);
    }

    userCompletedRequests.forEach(req => {
      const reqDate = new Date(req.createdAt);
      const diffTime = today.getTime() - reqDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        weeklyActivityData[6 - diffDays]++;
      }
    });

    const weeklyActivity = weeklyActivityData.map((count, i) => ({ day: dayLabels[i], count }));

    return {
      peopleHelped,
      highDemandSkills,
      weeklyActivity,
      totalTasksCompleted: userCompletedRequests.length,
      currentUserXp,
      leaderboard: leaderboardData,
      currentUserRank,
    };
  }, [user, users, posts, skillRequests]);

  const maxWeeklyActivity = Math.max(...analyticsData.weeklyActivity.map(d => d.count), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
       <button onClick={onBack} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">My Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total People Helped" value={analyticsData.peopleHelped} icon={<UsersIcon />} color="#3b82f6" />
        <StatCard title="Tasks Completed" value={analyticsData.totalTasksCompleted} icon={<CheckBadgeIcon />} color="#16a34a" />
        <StatCard title="Your Top Skill" value={analyticsData.highDemandSkills.find(s => user.skillsOffered.includes(s.skill))?.skill || 'N/A'} icon={<StarIcon />} color="#f59e0b" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 bg-white/95 dark:bg-zinc-900/85 p-6 rounded-2xl shadow-lg shadow-indigo-100/40 dark:shadow-black/50 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur">
           <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                <TrophyIcon className="w-6 h-6 text-amber-500" />
                Top Contributors
            </h2>
            <ul className="space-y-2">
                {analyticsData.leaderboard.slice(0, 5).map((leader, index) => (
                    <li key={leader.id} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${leader.id === user.id ? 'bg-indigo-50 dark:bg-indigo-900/40' : ''}`}>
                        <span className="font-bold text-lg text-zinc-500 dark:text-zinc-400 w-6 text-center">#{index + 1}</span>
                        <img src={leader.avatarUrl} alt={leader.name} className="w-10 h-10 rounded-full" />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex-grow">{leader.name}</span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">{leader.score.toLocaleString()} pts</span>
                    </li>
                ))}
            </ul>
        </div>

        <div className="bg-white/95 dark:bg-zinc-900/85 p-6 rounded-2xl shadow-lg shadow-indigo-100/40 dark:shadow-black/50 border border-zinc-200/80 dark:border-zinc-800/80 space-y-6 backdrop-blur">
            <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">My Progress</h2>
            <div>
                <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">My Rank</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">#{analyticsData.currentUserRank ?? 'N/A'}</p>
                </div>
                 <div className="flex justify-between items-baseline mt-2">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">XP Points</p>
                    <div className="flex items-center gap-1">
                        <BoltIcon className="w-5 h-5 text-yellow-500" />
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{analyticsData.currentUserXp.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
                <h3 className="text-md font-bold text-zinc-800 dark:text-zinc-200 text-center mb-4">Badges</h3>
                <div className="flex justify-center gap-4">
                    <Badge 
                        icon={<ShieldCheckIcon/>} 
                        label="Helper" 
                        unlocked={analyticsData.peopleHelped >= 5}
                        description="Help 5 people to unlock"
                    />
                </div>
            </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 bg-white/95 dark:bg-zinc-900/85 p-6 rounded-2xl shadow-lg shadow-indigo-100/40 dark:shadow-black/50 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur">
            <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                <ChartBarIcon className="w-6 h-6 text-indigo-500"/>
                My Weekly Activity
            </h2>
            <div className="h-64 flex items-end justify-between gap-2 border-b border-zinc-200 dark:border-zinc-700 pb-4">
                {analyticsData.weeklyActivity.map(({day, count}, index) => (
                    <div key={index} className="w-full h-full flex flex-col items-center justify-end group">
                        <div className="relative w-full h-full flex items-end justify-center">
                            <div className="absolute -top-7 hidden group-hover:block bg-zinc-700 dark:bg-zinc-900 text-white text-xs font-bold px-2 py-1 rounded-md">
                                {count}
                            </div>
                            <div 
                                className="w-3/4 bg-indigo-200 dark:bg-indigo-900/50 rounded-t-lg hover:bg-indigo-400 dark:hover:bg-indigo-600 transition-all"
                                style={{ height: `${(count / maxWeeklyActivity) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-2">{day}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white/95 dark:bg-zinc-900/85 p-6 rounded-2xl shadow-lg shadow-indigo-100/40 dark:shadow-black/50 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur">
            <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                <FireIcon className="w-6 h-6 text-orange-500" />
                Community High-Demand Skills
            </h2>
            {analyticsData.highDemandSkills.length > 0 ? (
                <ul className="space-y-3">
                    {analyticsData.highDemandSkills.map(({ skill, count }) => (
                        <li key={skill} className="flex items-center justify-between">
                            <span className="font-medium text-zinc-700 dark:text-zinc-200">{skill}</span>
                            <span className="font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-400 px-2 py-0.5 rounded-full text-sm">
                                {count} {count > 1 ? 'requests' : 'request'}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">No completed skill requests yet.</p>
            )}
        </div>
      </div>
    </div>
  );
};