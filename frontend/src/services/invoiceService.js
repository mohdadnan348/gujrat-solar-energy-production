import API from './api';

const invoiceService = {
  getAll: async () => (await API.get('/invoices')).data.data,

  getById: async (id) => (await API.get(`/invoices/${id}`)).data.data,

  // Keep the PDF response as binary data. Do not JSON.stringify or parse it.
  downloadPdf: async (id) => {
    const response = await API.get(`/invoices/${id}/pdf`, {
      responseType: 'arraybuffer',
      headers: {
        Accept: 'application/pdf',
      },
      transformResponse: [(data) => data],
    });

    return response.data;
  },

  create: async (data) => (await API.post('/invoices', data)).data.data,
  update: async (id, data) => (await API.put(`/invoices/${id}`, data)).data.data,
  updateStatus: async (id, status) =>
    (await API.put(`/invoices/${id}/status`, { status })).data.data,
  recordPayment: async (id, paymentData) =>
    (await API.post(`/invoices/${id}/payments`, paymentData)).data.data,
};

export default invoiceService;
