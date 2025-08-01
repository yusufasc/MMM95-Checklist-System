import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Box,
  Button,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

/**
 * 📝 Collaborative Notes Component
 * Real-time note editing and collaboration
 */
const CollaborativeNotes = memo(
  ({ meetingId, _meeting, isJoined, _participants = [] }) => {
    const { socket } = useSocket();
    const { user } = useAuth();

    // Notes state
    const [notes, setNotes] = useState([]);
    const [currentNote, setCurrentNote] = useState('');
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Typing state
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef(null);
    const noteFieldRef = useRef(null);

    /**
     * Load meeting notes
     */
    const loadNotes = useCallback(async () => {
      if (!meetingId) {
        return;
      }

      try {
        const response = await api.get(`/meeting-notes/meeting/${meetingId}`);
        setNotes(response.data || []);

        // Auto-select first note if available
        if (response.data?.length > 0 && !selectedNoteId) {
          setSelectedNoteId(response.data[0]._id);
          setCurrentNote(response.data[0].icerik);
        }
      } catch (error) {
        console.error('Error loading notes:', error);
        setError('Notlar yüklenirken hata oluştu');
      }
    }, [meetingId, selectedNoteId]);

    /**
     * Save note to database
     */
    const saveNote = useCallback(async () => {
      if (!meetingId || !user || !currentNote.trim()) {
        return;
      }

      setSaving(true);
      setError('');

      try {
        let response;

        if (selectedNoteId) {
          // Update existing note
          response = await api.put(`/meeting-notes/${selectedNoteId}`, {
            icerik: currentNote,
          });
        } else {
          // Create new note
          response = await api.post('/meeting-notes', {
            toplanti: meetingId,
            icerik: currentNote,
            notTuru: 'genel',
          });
          setSelectedNoteId(response.data._id);
        }

        // Update notes list
        setNotes(prev => {
          if (selectedNoteId) {
            return prev.map(note =>
              note._id === selectedNoteId
                ? { ...note, icerik: currentNote, guncellemeTarihi: new Date() }
                : note,
            );
          } else {
            return [...prev, response.data];
          }
        });

        // Broadcast note update to other participants
        if (socket && isJoined) {
          socket.emit('meeting:note:update', {
            meetingId,
            noteData: {
              noteId: selectedNoteId || response.data._id,
              content: currentNote,
              updatedBy: user.isim,
              version: 1,
            },
          });
        }

        setIsEditing(false);
      } catch (error) {
        console.error('Error saving note:', error);
        setError(
          error.response?.data?.message || 'Not kaydedilirken hata oluştu',
        );
      } finally {
        setSaving(false);
      }
    }, [meetingId, user, currentNote, selectedNoteId, socket, isJoined]);

    /**
     * Create new note
     */
    const createNewNote = () => {
      setSelectedNoteId(null);
      setCurrentNote('');
      setIsEditing(true);
      setTimeout(() => {
        if (noteFieldRef.current) {
          noteFieldRef.current.focus();
        }
      }, 100);
    };

    /**
     * Select existing note
     */
    const selectNote = note => {
      setSelectedNoteId(note._id);
      setCurrentNote(note.icerik);
      setIsEditing(false);
    };

    /**
     * Delete note
     */
    const deleteNote = async noteId => {
      if (!window.confirm('Bu notu silmek istediğinizden emin misiniz?')) {
        return;
      }

      try {
        await api.delete(`/meeting-notes/${noteId}`);

        setNotes(prev => prev.filter(note => note._id !== noteId));

        if (selectedNoteId === noteId) {
          const remainingNotes = notes.filter(note => note._id !== noteId);
          if (remainingNotes.length > 0) {
            selectNote(remainingNotes[0]);
          } else {
            setSelectedNoteId(null);
            setCurrentNote('');
          }
        }
      } catch (error) {
        console.error('Error deleting note:', error);
        setError('Not silinirken hata oluştu');
      }
    };

    /**
     * Handle typing events
     */
    const handleNoteChange = event => {
      const value = event.target.value;
      setCurrentNote(value);

      // Send typing indicator
      if (socket && isJoined && !isTyping) {
        setIsTyping(true);
        socket.emit('meeting:typing', {
          meetingId,
          userData: { id: user.id, isim: user.isim },
          isTyping: true,
        });
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (socket && isJoined) {
          socket.emit('meeting:typing', {
            meetingId,
            userData: { id: user.id, isim: user.isim },
            isTyping: false,
          });
        }
      }, 2000);
    };

    /**
     * Socket event listeners
     */
    useEffect(() => {
      if (!socket || !meetingId) {
        return () => {}; // Return cleanup function for consistency
      }

      const handleNoteUpdate = data => {
        // Update note in real-time (from other users)
        if (data.updatedBy !== user?.isim) {
          setNotes(prev =>
            prev.map(note =>
              note._id === data.noteId
                ? {
                    ...note,
                    icerik: data.content,
                    guncellemeTarihi: data.timestamp,
                  }
                : note,
            ),
          );

          // Update current note if it's the same one being edited
          if (selectedNoteId === data.noteId) {
            setCurrentNote(data.content);
          }
        }
      };

      const handleTyping = data => {
        setTypingUsers(prev => {
          if (data.isTyping) {
            const exists = prev.find(u => u.userId === data.userId);
            if (exists) {
              return prev;
            }
            return [...prev, { userId: data.userId, name: data.name }];
          } else {
            return prev.filter(u => u.userId !== data.userId);
          }
        });
      };

      socket.on('meeting:note:update', handleNoteUpdate);
      socket.on('meeting:typing', handleTyping);

      return () => {
        socket.off('meeting:note:update', handleNoteUpdate);
        socket.off('meeting:typing', handleTyping);
      };
    }, [socket, meetingId, user, selectedNoteId]);

    /**
     * Load notes on component mount
     */
    useEffect(() => {
      loadNotes();
    }, [loadNotes]);

    /**
     * Cleanup typing timeout
     */
    useEffect(() => {
      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }, []);

    return (
      <Box>
        {/* Header */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='center'
            >
              <Typography variant='h6'>
                <span role='img' aria-label='Not alma ikonu'>
                  📝
                </span>{' '}
                Toplantı Notları
              </Typography>
              <Button
                variant='contained'
                startIcon={<AddIcon />}
                onClick={createNewNote}
                disabled={!isJoined}
                size='small'
              >
                Yeni Not
              </Button>
            </Box>

            {/* Typing indicators */}
            {typingUsers.length > 0 && (
              <Box mt={2}>
                <Typography variant='caption' color='primary'>
                  <EditIcon sx={{ fontSize: 14, mr: 0.5 }} />
                  {typingUsers.map(u => u.name).join(', ')} yazıyor...
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity='error' sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Box display='flex' gap={2}>
          {/* Notes List */}
          <Card sx={{ minWidth: 300, maxWidth: 300 }}>
            <CardContent>
              <Typography variant='subtitle1' gutterBottom>
                Notlar ({notes.length})
              </Typography>

              {notes.length === 0 ? (
                <Box textAlign='center' py={3}>
                  <Typography variant='body2' color='text.secondary'>
                    Henüz not eklenmemiş
                  </Typography>
                </Box>
              ) : (
                <List dense>
                  {notes.map(note => (
                    <ListItem
                      key={note._id}
                      button
                      selected={selectedNoteId === note._id}
                      onClick={() => selectNote(note)}
                      secondaryAction={
                        <Tooltip title='Sil'>
                          <IconButton
                            edge='end'
                            size='small'
                            onClick={e => {
                              e.stopPropagation();
                              deleteNote(note._id);
                            }}
                          >
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography variant='body2' noWrap>
                            {note.icerik?.substring(0, 50) || 'Boş not'}
                            {note.icerik?.length > 50 && '...'}
                          </Typography>
                        }
                        secondary={
                          <Typography variant='caption'>
                            {format(new Date(note.olusturmaTarihi), 'HH:mm', {
                              locale: tr,
                            })}
                            {' - '}
                            {note.olusturan?.isim || 'Bilinmiyor'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Note Editor */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box
                display='flex'
                justifyContent='between'
                alignItems='center'
                mb={2}
              >
                <Typography variant='subtitle1'>
                  {selectedNoteId ? 'Not Düzenle' : 'Yeni Not Oluştur'}
                </Typography>

                {selectedNoteId && (
                  <Box display='flex' gap={1}>
                    <Button
                      size='small'
                      startIcon={isEditing ? <ViewIcon /> : <EditIcon />}
                      onClick={() => setIsEditing(!isEditing)}
                      disabled={!isJoined}
                    >
                      {isEditing ? 'Önizleme' : 'Düzenle'}
                    </Button>

                    {isEditing && (
                      <Button
                        variant='contained'
                        size='small'
                        startIcon={<SaveIcon />}
                        onClick={saveNote}
                        disabled={saving || !currentNote.trim()}
                      >
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                      </Button>
                    )}
                  </Box>
                )}
              </Box>

              {!isJoined ? (
                <Alert severity='info'>
                  Not düzenlemek için toplantıya katılmanız gerekiyor.
                </Alert>
              ) : (
                <>
                  {isEditing || !selectedNoteId ? (
                    <TextField
                      ref={noteFieldRef}
                      fullWidth
                      multiline
                      rows={15}
                      value={currentNote}
                      onChange={handleNoteChange}
                      placeholder='Toplantı notlarınızı buraya yazın...'
                      variant='outlined'
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontFamily: 'monospace',
                          fontSize: '14px',
                        },
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        minHeight: 360,
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'grey.50',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                      }}
                    >
                      {currentNote || 'Not içeriği boş...'}
                    </Box>
                  )}

                  {!selectedNoteId && (
                    <Box mt={2}>
                      <Button
                        variant='contained'
                        startIcon={<SaveIcon />}
                        onClick={saveNote}
                        disabled={saving || !currentNote.trim()}
                        fullWidth
                      >
                        {saving ? 'Kaydediliyor...' : 'Notu Kaydet'}
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    );
  },
);

CollaborativeNotes.displayName = 'CollaborativeNotes';

export default CollaborativeNotes;
