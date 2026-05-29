import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

export default function Icon({ name, ...props }: IconProps) {
  const icons: Record<string, React.ComponentType<LucideProps>> = {
    'message-circle': LucideIcons.MessageCircle,
    'users': LucideIcons.Users,
    'globe': LucideIcons.Globe,
    'compass': LucideIcons.Compass,
    'user': LucideIcons.User,
    'search': LucideIcons.Search,
    'plus': LucideIcons.Plus,
    'more-horizontal': LucideIcons.MoreHorizontal,
    'chevron-left': LucideIcons.ChevronLeft,
    'chevron-right': LucideIcons.ChevronRight,
    'smile': LucideIcons.Smile,
    'image': LucideIcons.Image,
    'send': LucideIcons.Send,
    'heart': LucideIcons.Heart,
    'message-square': LucideIcons.MessageSquare,
    'share': LucideIcons.Share2,
    'camera': LucideIcons.Camera,
    'map-pin': LucideIcons.MapPin,
    'phone': LucideIcons.Phone,
    'settings': LucideIcons.Settings,
    'star': LucideIcons.Star,
    'bookmark': LucideIcons.Bookmark,
    'bell': LucideIcons.Bell,
    'clock': LucideIcons.Clock,
    'check': LucideIcons.Check,
    'x': LucideIcons.X,
    'edit': LucideIcons.Edit3,
    'trash': LucideIcons.Trash2,
    'history': LucideIcons.History,
    'git-branch': LucideIcons.GitBranch,
    'pin': LucideIcons.Pin,
    'volume-x': LucideIcons.VolumeX,
  };

  const LucideIcon = icons[name] || LucideIcons.Circle;
  return <LucideIcon {...props} />;
}
