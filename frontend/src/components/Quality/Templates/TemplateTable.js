import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  formatCreatorName,
  formatEvaluationPeriod,
  getStatusChipConfig,
  calculateTotalScore,
  TABLE_COLUMNS,
  ALERT_MESSAGES,
} from '../../../utils/templatesConfig';

const TemplateTable = ({ templates, canEdit, onEdit, onDelete }) => {
  if (templates.length === 0) {
    return <Alert severity='info'>{ALERT_MESSAGES.NO_TEMPLATES}</Alert>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {TABLE_COLUMNS.map(column => (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                style={{ minWidth: column.minWidth }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {templates.map(template => (
            <TableRow key={template._id}>
              {/* Şablon Adı */}
              <TableCell>{template.ad}</TableCell>

              {/* Hedef Rol */}
              <TableCell>
                <Chip label={template.rol.ad} size='small' color='primary' />
              </TableCell>

              {/* Madde Sayısı */}
              <TableCell align='center'>{template.maddeler.length}</TableCell>

              {/* Toplam Puan */}
              <TableCell align='center'>
                {calculateTotalScore(template.maddeler)}
              </TableCell>

              {/* Değerlendirme Saatleri */}
              <TableCell>
                {template.degerlendirmeSaatleri?.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {template.degerlendirmeSaatleri.map((saat, index) => (
                      <Chip
                        key={index}
                        label={saat.saat}
                        size='small'
                        variant='outlined'
                        color='secondary'
                      />
                    ))}
                  </Box>
                ) : (
                  <Chip label='Her Zaman' size='small' color='default' />
                )}
              </TableCell>

              {/* Periyot */}
              <TableCell align='center'>
                <Chip
                  label={formatEvaluationPeriod(template.degerlendirmePeriyodu)}
                  size='small'
                  color='primary'
                  variant='outlined'
                />
              </TableCell>

              {/* Durum */}
              <TableCell align='center'>
                <Chip
                  label={getStatusChipConfig(template.aktif).label}
                  size='small'
                  color={getStatusChipConfig(template.aktif).color}
                />
              </TableCell>

              {/* Oluşturan */}
              <TableCell>
                {formatCreatorName(template.olusturanKullanici)}
              </TableCell>

              {/* İşlemler */}
              <TableCell align='right'>
                {canEdit && (
                  <>
                    <IconButton
                      onClick={() => onEdit(template)}
                      color='primary'
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => onDelete(template)}
                      color='error'
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

TemplateTable.propTypes = {
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      ad: PropTypes.string.isRequired,
      rol: PropTypes.shape({
        ad: PropTypes.string.isRequired,
      }).isRequired,
      maddeler: PropTypes.arrayOf(
        PropTypes.shape({
          maksimumPuan: PropTypes.number.isRequired,
        }),
      ).isRequired,
      degerlendirmeSaatleri: PropTypes.arrayOf(
        PropTypes.shape({
          saat: PropTypes.string.isRequired,
        }),
      ),
      degerlendirmePeriyodu: PropTypes.number,
      aktif: PropTypes.bool.isRequired,
      olusturanKullanici: PropTypes.shape({
        ad: PropTypes.string.isRequired,
        soyad: PropTypes.string.isRequired,
      }),
    }),
  ).isRequired,
  canEdit: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default TemplateTable;
