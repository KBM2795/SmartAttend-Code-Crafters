import React, { useState, useEffect } from 'react';
import { Plus, Search, X, UserPlus } from 'lucide-react';
import axios from 'axios';

const initialFormData = {
  name: '',
  rollNumber: '',
  class: '',
  section: '',
  department: '',
  semester: '',
  contactNumber: '',
  photo: null,
  parentDetails: {
    name: '',
    phone: '',
    email: ''
  }
};

const classOptions = ['FE', 'SE', 'TE', 'BE'];
const sectionOptions = ['A', 'B', 'C', 'D','E','F','G','H'];

const StudentsManagement = () => {
  const [students, setStudents] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [classes, setClasses] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, classesRes] = await Promise.all([
          axios.get('http://localhost:3000/api/students', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }),
          axios.get('http://localhost:3000/api/classes', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          })
        ]);

        setStudents(studentsRes.data);
        setClasses(classesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const setupInitialClasses = async () => {
      try {
        const existingClasses = await axios.get('http://localhost:3000/api/classes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (existingClasses.data.length === 0) {
          // Create default classes if none exist
          const defaultClasses = [
            { name: 'FE', section: 'A' },
            { name: 'SE', section: 'A' },
            { name: 'TE', section: 'A' },
            { name: 'BE', section: 'A' }
          ];

          for (const cls of defaultClasses) {
            await axios.post('http://localhost:3000/api/classes', cls, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
          }
        }
        
        // Fetch classes again after setup
        const response = await axios.get('http://localhost:3000/api/classes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setClasses(response.data);
      } catch (error) {
        console.error('Error setting up classes:', error);
      }
    };

    setupInitialClasses();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photo') {
      setFormData((prevData) => ({ ...prevData, [name]: files[0] }));
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    // Validate required fields
    const errors = {};
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.rollNumber) errors.rollNumber = 'Roll Number is required';
    if (!formData.class) errors.class = 'Class is required';
    if (!formData.department) errors.department = 'Department is required';
    if (!formData.semester) errors.semester = 'Semester is required';
    if (!formData.parentDetails.name) errors.parentName = 'Parent name is required';
    if (!formData.parentDetails.phone) errors.parentPhone = 'Parent phone is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const formDataObj = new FormData();
    
    // Append student details
    formDataObj.append('name', formData.name);
    formDataObj.append('rollNumber', formData.rollNumber);
    formDataObj.append('class', formData.class);
    formDataObj.append('department', formData.department);
    formDataObj.append('semester', formData.semester);
    formDataObj.append('section', formData.section);
    
    // Append parent details as JSON string
    formDataObj.append('parentDetails', JSON.stringify({
      name: formData.parentDetails.name,
      phone: formData.parentDetails.phone,
      email: formData.parentDetails.email || ''
    }));

    // Append photo if exists
    if (formData.photo) {
      formDataObj.append('photo', formData.photo);
    }

    try {
      const response = await axios.post(
        'http://localhost:3000/api/students/create',
        formDataObj,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        setStudents((prev) => [...prev, response.data.student]);
        setFormData(initialFormData);
        setIsAddModalOpen(false);
        
        // Show credentials in alert
        alert(`Student added successfully!\n\nLogin Credentials:\nEmail: ${response.data.credentials.email}\nPassword: ${response.data.credentials.password}\n\nPlease save these credentials!`);
      }
    } catch (error) {
      console.error('Error adding student:', error.response?.data || error);
      alert(error.response?.data?.message || 'Error adding student');
    }
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return value.trim().length < 2 ? 'Name must be at least 2 characters' : '';
      case 'rollNumber':
        return value.trim().length < 4 ? 'Roll Number must be at least 4 characters' : '';
      case 'class':
        return !value ? 'Please select a class' : '';
      case 'section':
        return !value ? 'Please select a section' : '';
      case 'contactNumber':
        return !/^\d{10}$/.test(value) ? 'Contact number must be 10 digits' : '';
      default:
        return '';
    }
  };

  const yaerOptions = ['FE','SE','TE','BE'];
  const departmetOptions = ['A', 'B', 'C', 'D'];

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      class: student.class._id,
      department: student.department,
      semester: student.semester,
      contactNumber: student.contactNumber || '',
      section: student.section || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:3000/api/students/${editingStudent._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setStudents(students.map(s => 
        s._id === editingStudent._id ? response.data : s
      ));
      setIsEditModalOpen(false);
      setEditingStudent(null);
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/students/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setStudents(students.filter(s => s._id !== id));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-gray-400">Manage your student records</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition-colors"
        >
          <UserPlus className="mr-2" /> Add Student
        </button>
      </div>

      {/* Student List */}
      <div className="bg-gray-900 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Student List</h2>
        <p className="text-gray-400 mb-4">View and manage all students in the system</p>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2 w-full">
            <input
              type="text"
              placeholder="Search by name or roll number..."
              className="bg-transparent text-white w-full focus:outline-none"
            />
            <Search className="text-gray-400" />
          </div>
          <select className="bg-gray-800 text-gray-400 rounded-lg px-3 py-2">
            <option value="">Filter by class</option>
            {classOptions.map(cls => (
              <option key={cls} value={cls}>Class {cls}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800 text-gray-400">
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Roll Number</th>
                <th className="py-2 px-4">Class</th>
                <th className="py-2 px-4">Section</th>
                <th className="py-2 px-4">Contact Number</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-400">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student, index) => (
                  <tr key={student._id} className="border-t border-gray-800">
                    <td className="py-2 px-4">{student.name}</td>
                    <td className="py-2 px-4">{student.rollNumber}</td>
                    <td className="py-2 px-4">{student.class?.name} - {student.class?.section}</td>
                    <td className="py-2 px-4">{student.department}</td>
                    <td className="py-2 px-4">{student.semester}</td>
                    <td className="py-2 px-4">
                      <button 
                        onClick={() => handleEditClick(student)} 
                        className="text-blue-500 hover:underline"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(student._id)}
                        className="text-red-500 hover:underline ml-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black  bg-opacity-100 flex items-center justify-center z-50 p-4 overflow-y-auto  no-scrollbar">
          <div className="bg-gray-900 rounded-lg p-10 h-[80vh] w-full max-w-lg relative overflow-auto no-scrollbar">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X />
            </button>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <UserPlus className="mr-2" /> Add New Student
            </h2>
            <form onSubmit={handleAddStudent}>
              <div className="space-y-4 ">
                <div>
                  <label className="block mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full bg-gray-800 border rounded-lg p-2 
                      ${formErrors.name 
                        ? 'border-red-500' 
                        : 'border-gray-700'
                      }`}
                    placeholder="Enter student name"
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Roll Number</label>
                  <input
                    type="text"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    className={`w-full bg-gray-800 border rounded-lg p-2 
                      ${formErrors.rollNumber 
                        ? 'border-red-500' 
                        : 'border-gray-700'
                      }`}
                    placeholder="Enter roll number"
                  />
                  {formErrors.rollNumber && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.rollNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Class</label>
                  <select
                    name="class"
                    value={formData.class || ''}
                    onChange={handleChange}
                    className={`w-full bg-gray-800 border rounded-lg p-2 
                      ${formErrors.class ? 'border-red-500' : 'border-gray-700'}`}
                  >
                    <option value="">Select class</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} - {cls.section}
                      </option>
                    ))}
                  </select>
                  {formErrors.class && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.class}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Section</label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className={`w-full bg-gray-800 border rounded-lg p-2 
                      ${formErrors.section 
                        ? 'border-red-500' 
                        : 'border-gray-700'
                      }`}
                  >
                    <option value="">Select section</option>
                    {sectionOptions.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                  {formErrors.section && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.section}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Parent Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className={`w-full bg-gray-800 border rounded-lg p-2 
                      ${formErrors.contactNumber 
                        ? 'border-red-500' 
                        : 'border-gray-700'
                      }`}
                    placeholder="Enter contact number"
                  />
                  {formErrors.contactNumber && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.contactNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department || ''}
                    onChange={handleChange}
                    className={`w-full bg-gray-800 border rounded-lg p-2 
                      ${formErrors.department ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="Enter department"
                  />
                  {formErrors.department && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.department}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2">Semester</label>
                  <select
                    name="semester"
                    value={formData.semester || ''}
                    onChange={handleChange}
                    className={`w-full bg-gray-800 border rounded-lg p-2 
                      ${formErrors.semester ? 'border-red-500' : 'border-gray-700'}`}
                  >
                    <option value="">Select semester</option>
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <option key={num} value={num}>Semester {num}</option>
                    ))}
                  </select>
                  {formErrors.semester && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.semester}</p>
                  )}
                </div>
              </div>
            <div>
                <label className="block mb-2">Student Photo</label>
                <div className="flex items-center justify-center w-full">
                    <label className="w-full flex flex-col items-center px-4 py-6 bg-gray-800 text-gray-400 rounded-lg tracking-wide border border-gray-700 cursor-pointer hover:bg-gray-700">
                        <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1z"/>
                        </svg>
                        <span className="mt-2 text-base">Select student photo</span>
                        <input type='file' className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                setFormData(prev => ({ ...prev, photo: file }));
                            }
                        }} />
                    </label>
                </div>
                {formData.photo && (
                    <div className="mt-2 text-sm text-gray-400">
                        Selected: {formData.photo.name}
                    </div>
                )}
            </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mt-4">Parent Details</h3>
                <div>
                  <label className="block mb-2">Parent Name</label>
                  <input
                    type="text"
                    name="parentDetails.name"
                    value={formData.parentDetails.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      parentDetails: {
                        ...formData.parentDetails,
                        name: e.target.value
                      }
                    })}
                    className="w-full bg-gray-800 border rounded-lg p-2"
                    placeholder="Enter parent name"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">Parent Phone</label>
                  <input
                    type="tel"
                    name="parentDetails.phone"
                    value={formData.parentDetails.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      parentDetails: {
                        ...formData.parentDetails,
                        phone: e.target.value
                      }
                    })}
                    className="w-full bg-gray-800 border rounded-lg p-2"
                    placeholder="Enter parent phone (+91XXXXXXXXXX)"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">Parent Email (Optional)</label>
                  <input
                    type="email"
                    name="parentDetails.email"
                    value={formData.parentDetails.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      parentDetails: {
                        ...formData.parentDetails,
                        email: e.target.value
                      }
                    })}
                    className="w-full bg-gray-800 border rounded-lg p-2"
                    placeholder="Enter parent email"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button 
                  type="submit"
                  className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Student Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md relative">
            <button 
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingStudent(null);
                setFormData(initialFormData);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X />
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Student</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full bg-gray-800 border rounded-lg p-2 
                      ${formErrors.name 
                        ? 'border-red-500' 
                        : 'border-gray-700'
                      }`}
                    placeholder="Enter student name"
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Roll Number</label>
                  <input
                    type="text"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    className={`w-full bg-gray-800 border rounded-lg p-2 
                      ${formErrors.rollNumber 
                        ? 'border-red-500' 
                        : 'border-gray-700'
                      }`}
                    placeholder="Enter roll number"
                  />
                  {formErrors.rollNumber && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.rollNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Class</label>
                  <select
                    name="class"
                    value={formData.class || ''}
                    onChange={handleChange}
                    className={`w-full bg-gray-800 border rounded-lg p-2 
                      ${formErrors.class ? 'border-red-500' : 'border-gray-700'}`}
                  >
                    <option value="">Select class</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} - {cls.section}
                      </option>
                    ))}
                  </select>
                  {formErrors.class && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.class}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Section</label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className={`w-full bg-gray-800 border rounded-lg p-2 
                      ${formErrors.section 
                        ? 'border-red-500' 
                        : 'border-gray-700'
                      }`}
                  >
                    <option value="">Select section</option>
                    {sectionOptions.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                  {formErrors.section && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.section}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Parent Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className={`w-full bg-gray-800 border rounded-lg p-2 
                      ${formErrors.contactNumber 
                        ? 'border-red-500' 
                        : 'border-gray-700'
                      }`}
                    placeholder="Enter contact number"
                  />
                  {formErrors.contactNumber && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.contactNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department || ''}
                    onChange={handleChange}
                    className={`w-full bg-gray-800 border rounded-lg p-2 
                      ${formErrors.department ? 'border-red-500' : 'border-gray-700'}`}
                    placeholder="Enter department"
                  />
                  {formErrors.department && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.department}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2">Semester</label>
                  <select
                    name="semester"
                    value={formData.semester || ''}
                    onChange={handleChange}
                    className={`w-full bg-gray-800 border rounded-lg p-2 
                      ${formErrors.semester ? 'border-red-500' : 'border-gray-700'}`}
                  >
                    <option value="">Select semester</option>
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <option key={num} value={num}>Semester {num}</option>
                    ))}
                  </select>
                  {formErrors.semester && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.semester}</p>
                  )}
                </div>
              </div>
            <div>
                <label className="block mb-2">Student Photo</label>
                <div className="flex items-center justify-center w-full">
                    <label className="w-full flex flex-col items-center px-4 py-6 bg-gray-800 text-gray-400 rounded-lg tracking-wide border border-gray-700 cursor-pointer hover:bg-gray-700">
                        <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1z"/>
                        </svg>
                        <span className="mt-2 text-base">Select student photo</span>
                        <input type='file' className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                setFormData(prev => ({ ...prev, photo: file }));
                            }
                        }} />
                    </label>
                </div>
                {formData.photo && (
                    <div className="mt-2 text-sm text-gray-400">
                        Selected: {formData.photo.name}
                    </div>
                )}
            </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mt-4">Parent Details</h3>
                <div>
                  <label className="block mb-2">Parent Name</label>
                  <input
                    type="text"
                    name="parentDetails.name"
                    value={formData.parentDetails.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      parentDetails: {
                        ...formData.parentDetails,
                        name: e.target.value
                      }
                    })}
                    className="w-full bg-gray-800 border rounded-lg p-2"
                    placeholder="Enter parent name"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">Parent Phone</label>
                  <input
                    type="tel"
                    name="parentDetails.phone"
                    value={formData.parentDetails.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      parentDetails: {
                        ...formData.parentDetails,
                        phone: e.target.value
                      }
                    })}
                    className="w-full bg-gray-800 border rounded-lg p-2"
                    placeholder="Enter parent phone (+91XXXXXXXXXX)"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2">Parent Email (Optional)</label>
                  <input
                    type="email"
                    name="parentDetails.email"
                    value={formData.parentDetails.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      parentDetails: {
                        ...formData.parentDetails,
                        email: e.target.value
                      }
                    })}
                    className="w-full bg-gray-800 border rounded-lg p-2"
                    placeholder="Enter parent email"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button 
                  type="submit"
                  className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Edit Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="mb-4">Are you sure you want to delete this student?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsManagement;