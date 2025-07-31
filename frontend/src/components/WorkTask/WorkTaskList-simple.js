// WorkTaskList Simple - Emergency Fallback
// Sadece temel list functionality

import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';

const WorkTaskListSimple = ({ checklists = [], onChecklistSelect }) => {
  console.log(
    '🔧 Simple WorkTaskList rendered with:',
    checklists.length,
    'items',
  );

  // Debug: Her checklist'in detaylarını logla
  checklists.forEach((checklist, index) => {
    console.log(
      `   ${index + 1}. ${checklist.ad} - Maddeler:`,
      checklist.maddeler?.length || 0,
    );
    if (checklist.maddeler && checklist.maddeler.length > 0) {
      checklist.maddeler.forEach((madde, maddeIndex) => {
        console.log(
          `      ${maddeIndex + 1}. ${madde.soru || madde.baslik} (${madde.puan} puan)`,
        );
      });
    }
  });

  const handleChecklistClick = checklist => {
    onChecklistSelect(checklist);
  };

  return (
    <Box>
      <Typography variant='h5' sx={{ mb: 2 }}>
        Mevcut Checklistler ({checklists.length} adet)
      </Typography>

      <List>
        {checklists.map((checklist, index) => (
          <ListItem
            key={index}
            sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}
          >
            <ListItemText primary={checklist.ad || 'No Name'} />
            <Button
              variant='contained'
              onClick={() => handleChecklistClick(checklist)}
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            >
              Seç
            </Button>
          </ListItem>
        ))}
      </List>

      {checklists.length === 0 && (
        <Typography color='error'>No checklists found</Typography>
      )}
    </Box>
  );
};

export default WorkTaskListSimple;
