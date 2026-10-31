import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  LucideDynamicIcon,
  type LucideIconInput,
  LucideArrowRight,
  LucideCalendar,
  LucideCheckCircle2,
  LucideChevronLeft,
  LucideCircle,
  LucideCreditCard,
  LucideDollarSign,
  LucideEye,
  LucideEyeOff,
  LucideLoader2,
  LucideLock,
  LucideMail,
  LucidePlus,
  LucideShield,
  LucideTrash2,
  LucideTrendingUp,
  LucideUser,
  LucideUsers,
  LucideXCircle,
  LucideAlertCircle,
  LucideCheck,
  LucideClock,
  LucideMapPin,
  LucideMenu,
  LucidePhone,
  LucideX,
} from '@lucide/angular';

const ICONS: Record<string, LucideIconInput> = {
  ArrowRight: LucideArrowRight,
  Calendar: LucideCalendar,
  CheckCircle2: LucideCheckCircle2,
  ChevronLeft: LucideChevronLeft,
  Circle: LucideCircle,
  CreditCard: LucideCreditCard,
  DollarSign: LucideDollarSign,
  Eye: LucideEye,
  EyeOff: LucideEyeOff,
  Loader2: LucideLoader2,
  Lock: LucideLock,
  Mail: LucideMail,
  Plus: LucidePlus,
  Shield: LucideShield,
  Trash2: LucideTrash2,
  TrendingUp: LucideTrendingUp,
  User: LucideUser,
  Users: LucideUsers,
  XCircle: LucideXCircle,
  AlertCircle: LucideAlertCircle,
  Check: LucideCheck,
  Clock: LucideClock,
  MapPin: LucideMapPin,
  Menu: LucideMenu,
  Phone: LucidePhone,
  X: LucideX,
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [LucideDynamicIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./icon.component.css'],
  template: `
    <svg
      [lucideIcon]="iconData()"
      [size]="size()"
      [class]="className()"
      aria-hidden="true"
    ></svg>
  `,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input<number>(24);
  readonly className = input<string>('');

  readonly iconData = computed(() => ICONS[this.name()] || LucideCircle);
}
