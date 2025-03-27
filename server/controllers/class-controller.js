import Class from '../models/class-model.js';
import Student from '../models/student-model.js';
import mongoose from 'mongoose';

export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find();
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createClass = async (req, res) => {
  try {
    const { name, section } = req.body;
    const newClass = new Class({ name, section });
    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getStudentsByClass = async (req, res) => {
  try {
    const classId = req.params.classId;
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: 'Invalid class ID format' });
    }

    const students = await Student.find({ class: classId })
      .select('_id name photo status')
      .lean();

    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: error.message });
  }
};
