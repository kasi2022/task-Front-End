import { Box, TextField, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import React from 'react';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CheckIcon from '@mui/icons-material/Check';

function Comsumer() {
  const [rows, setRows] = React.useState([]);
  const [search, setSearch] = React.useState('');
  const [editedQuantities, setEditedQuantities] = React.useState({});

  const fetchData = () => {
    axios
      .get('https://restaurant-inventory-tracker-backend.onrender.com/api/v1/getproduct')
      .then((res) => {
        const mappedRows = res.data.items.map((item) => ({
          ...item,
          id: item._id,
        }));
        setRows(mappedRows);
      })
      .catch((err) => console.error('Fetch error:', err));
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (id, value) => {
    if (!isNaN(value)) {
      setEditedQuantities((prev) => ({ ...prev, [id]: Number(value) }));
    }
  };

  const handleQuantityChange = async (id) => {
    const newQuantity = editedQuantities[id];
    const item = rows.find((row) => row.id === id);

    if (!item || newQuantity == null || newQuantity === item.quantity) return;

    try {
      const quantityUsed = item.quantity - newQuantity;

      await axios.patch(
        `https://restaurant-inventory-tracker-backend.onrender.com/api/v1/consumer/${id}/quantity`,
        { quantity: newQuantity },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (quantityUsed > 0) {
        await axios.post(
          `https://restaurant-inventory-tracker-backend.onrender.com/api/v1/consume/${id}`,
          {
            quantityUsed,
            consumer: 'admin',
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      setEditedQuantities((prev) => ({ ...prev, [id]: undefined }));
      fetchData();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
    }
  };

  const filteredRows = rows.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Item Name', width: 160 },
    { field: 'unit', headerName: 'Unit', width: 100 },
    {
      field: 'quantity',
      headerName: 'Quantity',
      width: 260,
      renderCell: (params) => {
        const id = params.row.id;
        const currentQuantity = params.row.quantity;
        const editedQuantity = editedQuantities[id];
        const quantity = editedQuantity ?? currentQuantity;
        const isChanged = editedQuantity !== undefined && editedQuantity !== currentQuantity;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() =>
                setEditedQuantities((prev) => ({
                  ...prev,
                  [id]: Math.max(0, (prev[id] ?? currentQuantity) - 1),
                }))
              }
            >
              <RemoveIcon fontSize="small" />
            </IconButton>

            <TextField
              value={quantity}
              onChange={(e) => handleInputChange(id, e.target.value)}
              size="small"
              sx={{ width: 60 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuantityChange(id);
              }}
            />

            <IconButton
              size="small"
              onClick={() =>
                setEditedQuantities((prev) => ({
                  ...prev,
                  [id]: (prev[id] ?? currentQuantity) + 1,
                }))
              }
            >
              <AddIcon fontSize="small" />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => handleQuantityChange(id)}
              title="Save"
              sx={{ color: isChanged ? 'green' : 'inherit' }} // Green when edited
            >
              <CheckIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ m: 2 }}>
      <TextField
        label="Search Item"
        variant="outlined"
        size="small"
        fullWidth
        sx={{ mb: 2 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <DataGrid
        rows={filteredRows}
        columns={columns}
        pageSizeOptions={[5]}
        paginationModel={{ pageSize: 5, page: 0 }}
        disableRowSelectionOnClick
      />
    </Box>
  );
}

export default Comsumer;
