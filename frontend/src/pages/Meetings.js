import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Snackbar,
  Pagination,
  Backdrop,
} from '@mui/material';
import {
  Add as AddIcon,
  Groups as GroupsIcon,
  Refresh as RefreshIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useMeetingsData } from '../hooks/useMeetingsData';
import api from '../services/api';
import MeetingTable from '../components/Meetings/MeetingTable';
import MeetingDialog from '../components/Meetings/MeetingDialog';
import MeetingFilters from '../components/Meetings/MeetingFilters';
import MeetingExcelDialog from '../components/Meetings/MeetingExcelDialog';
import LoadingWrapper from '../components/common/LoadingWrapper';

/**
 * 📅 Meetings Page Component
 * MMM95 pattern: Full-featured data management page
 */
const Meetings = memo(() => {
  const { user, hasModulePermission } = useAuth();
  const navigate = useNavigate();

  // Custom hooks
  const {
    meetings,
    users,
    departments,
    machines,
    checklists,
    pagination,
    filters,
    loading,
    error,
    success,
    loadMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    startMeeting,
    finishMeeting,
    applyFilters,
    clearFilters,
    changePage,
    clearMessages,
  } = useMeetingsData();

  // Local state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    meetingId: null,
  });

  // Permission checks
  const canCreateMeeting = hasModulePermission(
    'Toplantı Yönetimi',
    'duzenleyebilir',
  );
  const canViewMeetings = hasModulePermission(
    'Toplantı Yönetimi',
    'erisebilir',
  );

  /**
   * Handle create meeting
   */
  const handleCreateMeeting = async meetingData => {
    console.log('🚀 Creating meeting:', meetingData);
    const result = await createMeeting(meetingData);
    return result;
  };

  /**
   * Handle update meeting
   */
  const handleUpdateMeeting = async (id, meetingData) => {
    console.log('📝 Updating meeting:', id, meetingData);
    const result = await updateMeeting(id, meetingData);
    return result;
  };

  /**
   * Handle delete meeting
   */
  const handleDeleteMeeting = async id => {
    setConfirmDialog({ open: true, meetingId: id });
  };

  /**
   * Confirm delete meeting
   */
  const confirmDeleteMeeting = async () => {
    if (confirmDialog.meetingId) {
      await deleteMeeting(confirmDialog.meetingId);
      setConfirmDialog({ open: false, meetingId: null });
    }
  };

  /**
   * Handle start meeting
   */
  const handleStartMeeting = async id => {
    console.log('▶️ Starting meeting:', id);
    await startMeeting(id);
  };

  /**
   * Handle finish meeting
   */
  const handleFinishMeeting = async id => {
    console.log('⏹️ Finishing meeting:', id);
    await finishMeeting(id);
  };

  /**
   * Handle Excel operations
   */
  const handleExcelDialog = () => {
    setExcelDialogOpen(true);
  };

  const handleExcelUploadSuccess = result => {
    console.log('📊 Excel upload success:', result);
    // Refresh meetings list after import
    loadMeetings();
  };

  /**
   * Handle PDF export for individual meetings
   */
  const handleExportPDF = async meetingId => {
    try {
      console.log('📄 Exporting meeting PDF:', meetingId);

      // Call PDF export API
      const response = await api.get(`/pdf/meeting/${meetingId}`, {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Set filename
      const filename = `Toplanti_Raporu_${meetingId}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.setAttribute('download', filename);

      // Trigger download
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('✅ Meeting PDF exported successfully');
    } catch (error) {
      console.error('❌ Meeting PDF export error:', error);
      alert('PDF export sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  /**
   * Handle live meeting join
   */
  const handleLiveMeeting = meetingId => {
    console.log('🔴 Joining live meeting:', meetingId);
    navigate(`/meetings/${meetingId}/live`);
  };

  /**
   * Handle edit meeting
   */
  const handleEditMeeting = meeting => {
    setEditingMeeting(meeting);
    setDialogOpen(true);
  };

  /**
   * Handle view meeting details
   */
  const handleViewMeeting = meeting => {
    // TODO: Implement meeting detail view
    console.log('👁️ Viewing meeting:', meeting);
  };

  /**
   * Close dialog
   */
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMeeting(null);
  };

  /**
   * Handle page change
   */
  const handlePageChange = (event, newPage) => {
    changePage(newPage);
  };

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    loadMeetings();
  };

  // Permission check
  if (!canViewMeetings) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='warning'>
          Bu sayfayı görüntüleme yetkiniz bulunmuyor.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <GroupsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant='h4' component='h1' fontWeight='bold'>
              Toplantı Yönetimi
            </Typography>
            <Typography variant='subtitle1' color='textSecondary'>
              Toplantıları planlayın, yönetin ve takip edin
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            variant='outlined'
          >
            Yenile
          </Button>

          {canViewMeetings && (
            <Button
              startIcon={<ExcelIcon />}
              onClick={handleExcelDialog}
              disabled={loading}
              variant='outlined'
              color='success'
            >
              Excel
            </Button>
          )}

          {canCreateMeeting && (
            <Button
              startIcon={<AddIcon />}
              variant='contained'
              onClick={() => setDialogOpen(true)}
              disabled={loading}
            >
              Yeni Toplantı
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <MeetingFilters
        filters={filters}
        onFiltersChange={applyFilters}
        onClearFilters={clearFilters}
        users={users}
        departments={departments}
        loading={loading}
      />

      {/* Statistics */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant='h6'>Toplantılar ({pagination.total})</Typography>
        <Typography variant='body2' color='textSecondary'>
          Sayfa {pagination.current} / {pagination.pages}
        </Typography>
      </Paper>

      {/* Meeting Table */}
      <LoadingWrapper loading={loading}>
        <MeetingTable
          meetings={meetings}
          loading={loading}
          onEdit={handleEditMeeting}
          onDelete={handleDeleteMeeting}
          onView={handleViewMeeting}
          onStart={handleStartMeeting}
          onFinish={handleFinishMeeting}
          onLiveMeeting={handleLiveMeeting}
          onExportPDF={handleExportPDF}
          currentUser={user}
          hasEditPermission={canCreateMeeting}
        />
      </LoadingWrapper>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.pages}
            page={pagination.current}
            onChange={handlePageChange}
            color='primary'
            disabled={loading}
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Meeting Dialog */}
      <MeetingDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={editingMeeting ? handleUpdateMeeting : handleCreateMeeting}
        meeting={editingMeeting}
        users={users}
        departments={departments}
        machines={machines}
        checklists={checklists}
        loading={loading}
      />

      {/* Delete Confirmation Dialog */}
      <Backdrop
        open={confirmDialog.open}
        sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}
      >
        <Paper sx={{ p: 3, textAlign: 'center', maxWidth: 400 }}>
          <Typography variant='h6' gutterBottom>
            Toplantıyı Sil
          </Typography>
          <Typography variant='body2' color='textSecondary' sx={{ mb: 3 }}>
            Bu toplantıyı silmek istediğinizden emin misiniz? Bu işlem geri
            alınamaz.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Button
              onClick={() => setConfirmDialog({ open: false, meetingId: null })}
              variant='outlined'
            >
              İptal
            </Button>
            <Button
              onClick={confirmDeleteMeeting}
              variant='contained'
              color='error'
            >
              Sil
            </Button>
          </Box>
        </Paper>
      </Backdrop>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={clearMessages}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={clearMessages}
          severity='success'
          variant='filled'
          sx={{ width: '100%' }}
        >
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={clearMessages}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={clearMessages}
          severity='error'
          variant='filled'
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Excel Dialog */}
      <MeetingExcelDialog
        open={excelDialogOpen}
        onClose={() => setExcelDialogOpen(false)}
        onUploadSuccess={handleExcelUploadSuccess}
      />
    </Box>
  );
});

Meetings.displayName = 'Meetings';

export default Meetings;
