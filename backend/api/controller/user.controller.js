import User from "../../models/User.models";
export const register = async (res, req, next, err) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser)
            return res.status(400).json({ msg: "User already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            firstName: firstName || "",
            lastName: lastName || "",
        });
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json(err);
    }
};
export const login = async (res, req, next, err) => {
    try {
        const { email, password } = req.body
        const Matchuser =await User.findOne({email});
        const isMatch = await bcrypt.compare(password, User.password);
        if (!isMatch || Matchuser)
              return res.status(400).json({ msg: "Invalid credentials" });
            const token = jwt.sign(
              { id: User._id },
              process.env.JWT_SECRET,
              { expiresIn: "7d" }
            );
            res.json({ token, User });
    } catch (error) {
        res.status(500).json(err);
    }
};