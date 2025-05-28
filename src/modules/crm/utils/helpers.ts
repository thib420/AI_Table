export const getStatusColor = (status: string) => {
  switch (status) {
    case 'lead':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'prospect':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
    case 'customer':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'partner':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    case 'vendor':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300';
    case 'investor':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300';
    case 'employee':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
    case 'contractor':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300';
    case 'intern':
      return 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300';
    case 'inactive':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  }
};

export const getStageColor = (stage: string) => {
  switch (stage) {
    case 'prospecting':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    case 'qualification':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'proposal':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
    case 'negotiation':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    case 'closed-won':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'closed-lost':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  }
};

export const generateProfilePicture = (name: string) => {
  const colors = ['3B82F6', '8B5CF6', '10B981', 'F59E0B', 'EF4444', '6366F1', '14B8A6', 'F97316'];
  const colorIndex = name.length % colors.length;
  const backgroundColor = colors[colorIndex];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=64&background=${backgroundColor}&color=fff&bold=true&format=png`;
}; 