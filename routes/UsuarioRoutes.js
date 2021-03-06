const router = require('express').Router()

const UsuarioController = require('../controllers/UsuarioController')

// Middleware
const { imageUpload } = require('../helpers/imagem-upload')
const verificaToken = require('../helpers/verifica-token')

router.post('/cadastro', imageUpload.single("image"), UsuarioController.cadastroUsuario)
router.post('/login', UsuarioController.loginUsuario)
router.patch('/edicao', verificaToken, imageUpload.single("image"), UsuarioController.atualizaUsuario)
router.delete('/exclusao', UsuarioController.deletaUsuario)
router.get('/check', verificaToken, UsuarioController.checkUsuario)
router.get('/:id', UsuarioController.buscaUsuarioId)
router.get('/', UsuarioController.buscaUsuarios)
router.patch('/visibilidade', UsuarioController.visibilidadeUsuario)
router.post('/', UsuarioController.pesquisaUsuario)

module.exports = router
