/**
 * Shared UI components for Skolist frontend apps
 * Based on shadcn/ui with Radix UI primitives
 */

// Primitives
export { Button, buttonVariants, type ButtonProps } from "./components/button";
export { Input, type InputProps } from "./components/input";
export { Slider } from "./components/slider";
export { Label } from "./components/label";
export { Checkbox } from "./components/checkbox";
export { Separator } from "./components/separator";
export { Badge, badgeVariants, type BadgeProps } from "./components/badge";
export { Textarea, type TextareaProps } from "./components/textarea";
export { Switch } from "./components/switch";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./components/select";
export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./components/collapsible";

// Layout
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/card";

// Navigation
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/tabs";

// Feedback
export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
  type ToastActionElement,
} from "./components/toast";
export { Toaster } from "./components/toaster";
export { useToast, toast } from "./hooks/use-toast";

// Overlay
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./components/dialog";
export { Popover, PopoverTrigger, PopoverContent } from "./components/popover";
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./components/tooltip";

// Data Display
export { Avatar, AvatarImage, AvatarFallback } from "./components/avatar";

// Dropdown
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./components/dropdown-menu";

// Form
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "./components/form";

// Icons (re-export lucide icons for convenience)
export {
  Loader2,
  Mail,
  Lock,
  Phone,
  User,
  LogOut,
  LogIn,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Info,
  Menu,
  Home,
  Settings,
  Search,
} from "lucide-react";

// Spinner component
export { Spinner } from "./components/spinner";
