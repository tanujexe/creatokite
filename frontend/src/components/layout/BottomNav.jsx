import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard,Target,BarChart2,Wallet,Trophy,Megaphone,PlusCircle,Users,TrendingUp,CheckSquare,MessageSquare,Radio } from 'lucide-react';

const NAV = {
  creator:     [{to:'/creator/dashboard',icon:LayoutDashboard,label:'Home'},{to:'/creator/assigned',icon:Target,label:'Campaigns'},{to:'/creator/analytics',icon:BarChart2,label:'Analytics'},{to:'/creator/earnings',icon:Wallet,label:'Earnings'},{to:'/creator/leaderboard',icon:Trophy,label:'Ranks'}],
  brand:       [{to:'/brand/dashboard',icon:LayoutDashboard,label:'Home'},{to:'/brand/campaigns',icon:Megaphone,label:'Campaigns'},{to:'/brand/campaigns/create',icon:PlusCircle,label:'Create'},{to:'/brand/analytics',icon:BarChart2,label:'Analytics'}],
  admin:       [{to:'/admin/dashboard',icon:LayoutDashboard,label:'Home'},{to:'/admin/campaigns',icon:Megaphone,label:'Campaigns'},{to:'/admin/users',icon:Users,label:'Users'},{to:'/admin/roles',icon:TrendingUp,label:'Roles'},{to:'/admin/analytics',icon:BarChart2,label:'Analytics'}],
  team_member: [{to:'/team/workspace',icon:LayoutDashboard,label:'Home'},{to:'/team/tasks',icon:CheckSquare,label:'Tasks'},{to:'/team/dm-tracker',icon:MessageSquare,label:'DMs'},{to:'/admin/rooms',icon:Radio,label:'Rooms'}],
  superadmin:  [{to:'/superadmin/dashboard',icon:LayoutDashboard,label:'Home'},{to:'/admin/users',icon:Users,label:'Users'},{to:'/admin/roles',icon:TrendingUp,label:'Roles'},{to:'/admin/audit',icon:BarChart2,label:'Audit'}],
};

export default function BottomNav() {
  return null;
}
