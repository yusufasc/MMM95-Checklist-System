/**
 * Material-UI Bundle Optimization
 * Tree-shaking için optimized import'lar
 */

// ❌ Yanlış: Tüm MUI'yi import eder
// import * from '@mui/material'

// ✅ Doğru: Sadece gerekli component'leri import et
export {
  // Layout & Structure
  Box,
  Container,
  Grid,
  Stack,
  Paper,
  Card,
  CardContent,
  CardActions,
  Divider,

  // Typography
  Typography,

  // Form Controls
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  Radio,
  Switch,
  Slider,

  // Feedback
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,

  // Navigation
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  BottomNavigation,
  BottomNavigationAction,

  // Data Display
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Avatar,
  Badge,

  // Progress
  CircularProgress,
  LinearProgress,

  // Utils
  CssBaseline,
  useTheme,
  alpha,
} from '@mui/material';

// Icon optimizasyonu
export {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  // Sadece kullanılan icon'lar
} from '@mui/icons-material';

/**
 * Bundle Size Optimization Tips:
 *
 * 1. MUI Icons: Sadece kullanılan icon'ları import et
 * 2. Lodash: import _ from 'lodash' yerine import { debounce } from 'lodash'
 * 3. Date-fns: import * yerine import { format } from 'date-fns'
 * 4. Chart.js: Sadece gerekli chart tiplerini import et
 */
