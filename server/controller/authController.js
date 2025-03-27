import jwt from "jsonwebtoken";
import User from "../models/user-model.js"
import bcrypt from "bcrypt"


const login = async function (req,res){
    try {
        const {email,password} = req.body;
        
         
        const user = await User.findOne({email})
        
        
        if (!user) {
            res.status(404).json({success: false ,error: 'User not found'})
        }
  
        const ismatch =await bcrypt.compare(password,user.password)

        if(!ismatch) {
           return res.status(401).json({success: false ,error: 'Password or email is incorrect'})
        }

        const token = jwt.sign({id_:user.id , role: user.role }, process.env.JWT_KEY, {expiresIn: "10d"} )

        res
        .status(200)
        .json({
            success: true,
             token ,
             user : {_id: user._id , name: user.name  , role: user.role },
            })

    } catch (error) {
       res.status(500).json({ success: false, error: error.message})

    }
}

const register = async (req, res) => {
    try {
      const { name, email, password } = req.body;
      console.log(req.body);
      
      // Validate input
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      // Check if the user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role: 'teacher',
      });
  
      // Save the user to the database
      await newUser.save();
  
      // Respond with success
      res.status(201).json({ message: 'User registered successfully', user: { name, email } });
    } catch (error) {
      console.error('Error in register:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };


const verify = (req, res) => {
    return res.status(200).json({success: true, error:req.user})
}


export {login, verify,register} 