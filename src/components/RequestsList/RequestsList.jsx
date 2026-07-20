import { useNavigate } from 'react-router-dom';
import { getAllRequests } from '../../mockData';

function RequestsList() {
  const navigate = useNavigate();
  const requests = getAllRequests();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Requests</h1>
      <div className="space-y-3">
        {requests.length === 0 ? (
          <p className="text-gray-400">No requests found</p>
        ) : (
          requests.map(req => (
            <div
              key={req.id}
              onClick={() => navigate(`/requests/${req.id}`)}
              className="bg-[#1a365d] border border-[#d4a574]/30 p-4 rounded-lg cursor-pointer hover:bg-[#1a365d]/80 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{req.employeeName}</p>
                  <p className="text-gray-400 text-sm">{req.type} • {req.email}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    req.status === 'completed' ? 'text-green-400' :
                    req.status === 'pending' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`}>
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </p>
                  <p className="text-gray-400 text-sm">{req.date}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RequestsList;
