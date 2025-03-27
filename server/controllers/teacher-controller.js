import Teacher from '../models/teacher-model.js';

export const getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id })
      .populate('assignedClasses');
    
    if (!teacher) {
      // Return empty profile if not found
      return res.status(200).json({
        name: '',
        department: '',
        subjects: [],
        assignedClasses: [],
        contactNumber: ''
      });
    }
    res.status(200).json(teacher);
  } catch (error) {
    console.error('Get teacher profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateTeacherProfile = async (req, res) => {
  try {
    const { name, department, subjects, assignedClasses, contactNumber } = req.body;

    // Validate required fields
    if (!name || !department) {
      return res.status(400).json({
        message: 'Name and department are required'
      });
    }

    // Find or create teacher profile
    let teacher = await Teacher.findOne({ userId: req.user._id });

    if (!teacher) {
      teacher = new Teacher({
        userId: req.user._id,
        name,
        department,
        subjects: subjects || [],
        assignedClasses: assignedClasses || [],
        contactNumber
      });
    } else {
      // Update existing teacher
      teacher.name = name;
      teacher.department = department;
      teacher.subjects = subjects || [];
      teacher.assignedClasses = assignedClasses || [];
      teacher.contactNumber = contactNumber;
    }

    await teacher.save();
    
    const updatedTeacher = await Teacher.findById(teacher._id)
      .populate('assignedClasses');

    res.status(200).json(updatedTeacher);
  } catch (error) {
    console.error('Update teacher profile error:', error);
    res.status(400).json({ message: error.message });
  }
};
