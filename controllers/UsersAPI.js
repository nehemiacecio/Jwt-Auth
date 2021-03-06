import Users from "../models/UserModel.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import axios from "axios";

export const getUsers = async (req, res) => {
  try {
    // const users = await Users.findAll()
    const users = await axios.get('http://localhost:8080/api/users')
    console.log(users.data);
    return res.send(users.data);
    // return res.json(users)
  } catch (error) {
    console.error(error)
  }
}

export const Register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  console.log(req.body);
  console.log(firstName);
  console.log(lastName);
  console.log(email);
  console.log(password);

  // if (password !== confPassword) return res.status(400).json({ msg: "Password dan Confirm Password tidak cocok" });
  // const salt = await bcrypt.genSalt();
  // const hashPassword = await bcrypt.hash(password, salt)

  try {
    const registers = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password
    }
    await axios.post('http://localhost:8080/api/users', registers)
      .then((responses) => {
        console.log(responses.data);
        return res.send(responses.data);
      })
      .catch((err) => {
        console.log(err);
      });

    // const data = res.data
    // console.log(data)
    // return res.send(registers.data)
    // res.json({ msg: "Register berhasil" });
  } catch (error) {
    console.log(error)
  }
}

export const Login = async (req, res) => {
  console.log(req.body.email);
  try {
    // const user = await axios.get('http://localhost:8080/api/users/findOne',{
    //   params: {
    //     email: req.body.email
    //   }
    // });
    const user = await axios.get('http://localhost:8080/api/users/'+req.body.email);
    console.log(user.data);
    return res.send(user.data);

    await axios.put('/')

    const match = await bcrypt.compare(req.body.password, user[0].password);
    if (!match) return res.status(400).json({ msg: "Wrong Password" })
    const userId = user[0].id;
    const name = user[0].name;
    const email = user[0].email;
    const accessToken = jwt.sign({ userId, name, email }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '20s'
    });
    const refreshToken = jwt.sign({ userId, name, email }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: '1d'
    });
    await Users.update({ refresh_token: refreshToken }, {
      where: {
        id: userId
      }
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });
    res.json({ accessToken })
  } catch (error) {
    res.status(404).json({ msg: "Email tidak ditemukan" })
  }
}

export const Logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(204);
  const user = await Users.findAll({
    where: {
      refresh_token: refreshToken
    }
  });
  if (!user[0]) return res.sendStatus(204);
  const userId = user[0].id
  await Users.update({ refresh_token: null }, {
    where: {
      id: userId
    }
  });
  res.clearCookie('refreshToken')
  return res.sendStatus(200)
}
