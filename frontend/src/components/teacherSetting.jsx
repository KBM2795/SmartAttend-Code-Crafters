import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const TeacherSettings = () => {
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    contactNumber: '',
    subjects: [{ name: '', code: '' }],
    assignedClasses: []
  });
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTeacherProfile();
    fetchAvailableClasses();
  }, []);

  const fetchTeacherProfile = async () => {
    try {
      const data = await api.getTeacherProfile();
      setFormData({
        name: data.name || '',
        department: data.department || '',
        contactNumber: data.contactNumber || '',
        subjects: data.subjects || [{ name: '', code: '' }],
        assignedClasses: data.assignedClasses?.map(c => c._id) || []
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      const classes = await api.getClasses();
      setAvailableClasses(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateTeacherProfile(formData);
      setMessage('Settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating settings');
      console.error('Error:', error);
    }
  };

  const addSubject = () => {
    setFormData({
      ...formData,
      subjects: [...formData.subjects, { name: '', code: '' }]
    });
  };

  const removeSubject = (index) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        {message && (
          <div className="bg-green-500/20 text-green-500 p-3 rounded">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contact Number
            </label>
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subjects
            </label>
            {formData.subjects.map((subject, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={subject.name}
                  onChange={(e) => {
                    const newSubjects = [...formData.subjects];
                    newSubjects[index].name = e.target.value;
                    setFormData({...formData, subjects: newSubjects});
                  }}
                  className="flex-1 bg-gray-800 text-white border border-gray-700 rounded p-2"
                />
                <input
                  type="text"
                  placeholder="Subject Code"
                  value={subject.code}
                  onChange={(e) => {
                    const newSubjects = [...formData.subjects];
                    newSubjects[index].code = e.target.value;
                    setFormData({...formData, subjects: newSubjects});
                  }}
                  className="w-24 bg-gray-800 text-white border border-gray-700 rounded p-2"
                />
                <button
                  type="button"
                  onClick={() => removeSubject(index)}
                  className="bg-red-500/20 text-red-500 px-3 py-2 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSubject}
              className="bg-green-500/20 text-green-500 px-3 py-2 rounded mt-2"
            >
              Add Subject
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assigned Classes
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableClasses.map(cls => (
                <label key={cls._id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.assignedClasses.includes(cls._id)}
                    onChange={(e) => {
                      const newClasses = e.target.checked
                        ? [...formData.assignedClasses, cls._id]
                        : formData.assignedClasses.filter(id => id !== cls._id);
                      setFormData({...formData, assignedClasses: newClasses});
                    }}
                    className="bg-gray-800 border-gray-700"
                  />
                  <span>{cls.name} - {cls.section}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
};

export default TeacherSettings;