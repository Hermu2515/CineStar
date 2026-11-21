/*Controlador HTTP para registro e inicio de sesión de usuarios */
export class AuthController {
  constructor(registerUserService, loginUserService) {
    this.registerUserService = registerUserService;
    this.loginUserService = loginUserService;
  }

  register = async(req, res, next) =>{
    try{
        const usuario = await this.registerUserService.execute(req.body)
        return res.status(201).json(usuario)
    }catch(error){
        return next(error);
    }
  }

  login = async(req, res, next) =>{
    try{
        const result = await this.loginUserService.execute(req.body)
        return res.status(200).json(result)
    }catch(error){
        return next(error);
    }
  }
}