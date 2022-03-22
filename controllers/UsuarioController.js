const Usuario = require('../models/Usuario')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// Helpers
const criaTokenUsuario = require('../helpers/token-usuario')
const coletaToken = require('../helpers/coleta-token')
const buscaUsuarioToken = require('../helpers/busca-usuario-token')

// Validation
const cadastroValidation = require('../validations/CadastroValidation')

module.exports = class UsuarioController {

    static async cadastroUsuario(req, res) {

        const usuario = await cadastroValidation(req, res) // Função para validar entrada de dados e criptografar senha
        
        if(usuario !== undefined) {
            
            try {
                const usuarioCadastrado = await Usuario.create(usuario)

                await criaTokenUsuario(usuarioCadastrado, req, res) // Função para criar Token JWT
            } catch (err) {
                res.status(500).json({ message: err })
            }
        } 
    }

    static async loginUsuario(req, res) {
        const { email, senha } = req.body

        if(!email) {
            res.status(422).json({message: 'O e-mail é obrigatório'})
            return
        }

        if(!senha) {
            res.status(422).json({message: 'A senha é obrigatória'})
            return
        }

        const buscaUsuario = await Usuario.findOne({where: { email: email }})

        if(!buscaUsuario) {
            res.status(422).json({message: 'Nenhum usuário encontrado com este e-mail' })
            return
        }

        const checkSenha = await bcrypt.compare(senha, buscaUsuario.senha)

        if(!checkSenha) {
            res.status(422).json({message: 'Senha inválida, tente novamente'})
            return
        }
        await criaTokenUsuario(buscaUsuario, req, res)
    }


    static async atualizaUsuario(req, res) {
        const token = coletaToken(req)
        const usuario = await buscaUsuarioToken(token)

        const { 
            nome, email, senha, confirmacaosenha,
            telefone, estado, area, descricao, tecnologia 
        } = req.body

        let novaSenha = ''
        let senhaAtual = ''

        let novaImagem = usuario.imagem

        // Validações
        if(req.file) {
            novaImagem = req.file.filename
        }

        if(!nome) {
            res.status(422).json({message: 'O nome é obrigatório'})
            return
        } 

        if(!email) {
            res.status(422).json({message: 'O e-mail é obrigatório'})
            return
        }

        // Verifica se e-mail já está em uso
        const emailDisponivel = await Usuario.findOne({where: { email: email } })

        if(usuario.email !== email && emailDisponivel) {
            res.status(422).json({message: 'Por favor, utilize outro e-mail'})
            return
        }

        if(senha != confirmacaosenha) {
            res.status(422).json({ message: 'As senhas não conferem' })
            return
        } else if(senha === confirmacaosenha && senha != null) {
            
            // Criando nova senha criptografada
            const salt = await bcrypt.genSalt(12)
            const senhaCriptografada = await bcrypt.hash(senha, salt)

            novaSenha = senhaCriptografada
        } else if (senha == null) {
            senhaAtual = usuario.senha
        }

        if(!telefone) {
            res.status(422).json({message: 'O telefone é obrigatório'})
            return
        }

        if(!estado) {
            res.status(422).json({message: 'O estado é obrigatório'})
            return
        }

        if(!area) {
            res.status(422).json({message: 'A area de atuação é obrigatória'})
            return
        }

        if(!descricao) {
            res.status(422).json({message: 'A descrição é obrigatória'})
            return
        }

        if(!tecnologia) {
            res.status(422).json({message: 'Campo tecnologias é obrigatório'})
            return
        }

        let atualizacaoUsuario = {
            nome, email, imagem: novaImagem,
            telefone, estado, area, descricao, tecnologia
        }

        // Valida se usuário troucou a senha ou não
        if(novaSenha !== '') {
            atualizacaoUsuario.senha = novaSenha 
        } else {
            atualizacaoUsuario.senha = senhaAtual
        }

        console.log(atualizacaoUsuario)

        try {
            const usuarioAtualizado = await Usuario.update
                (
                    atualizacaoUsuario, {where: { id: usuario.id }}
                )
            res.status(200).json({message: 'Usuário atualizado com sucesso'})
        } catch (err) {
            res.status(500).json({message: err})
            return
        }

    }

    static async deletaUsuario(req, res) {
        const token = coletaToken(req)
        const usuario = await buscaUsuarioToken(token)

        try {
            await Usuario.destroy({where: { id: usuario.id }})
            res.status(200).json({message:'Usuário excluído com sucesso'})
        } catch (err) {
            res.status(500).send({message: err})
        }
    }

    static async checkUsuario(req, res) {

        const token = coletaToken(req)
        const usuario =  await buscaUsuarioToken(token)

        if(!usuario) {
            res.status(404).json({message: 'Usuário não encontrado'})
        } else {
            delete usuario.dataValues['senha'] 
            res.status(200).json(usuario)
        }

    }

    static async buscaUsuarios(req, res) {
        const usuarios = await Usuario.findAll({
            attributes: {exclude: ['senha', 'createdAt', 'updatedAt']}
        })

        if(!usuarios) {
            res.status(404).json({message: 'Nenhum usuário encontrado'})
        }

        res.status(200).json({ usuarios: usuarios })
    }

}