const express = require('express')
const _ = require('lodash')
const EventProxy = require('eventproxy')
const router = express.Router()
const topicModel = require('../models/topic')
const userModel = require('../models/user')
const replyModel = require('../models/reply')
const auth = require('../middlewares/tokenverify')
/* GET topics listing. */

router.route('/')
  .get((req, res, next) => {
    (async () => {
      let {page, pageSize} = req.query
      page = Math.floor(page > 0 ? page : 1)
      pageSize = Math.floor(pageSize > 0 ? pageSize : 10)
      let {topics, count} = await topicModel.getTopics({page, pageSize})
      res.json({
        code: 0,
        data: topics,
        count,
        page,
        pageSize,
      })
    })()
      .catch(err => next(err))
  })
  .post(auth(), (req, res, next) => {
    (async () => {
      const user = await userModel.getUserById(req.session.userId)//验证
      if (!user) { throw new ErrorValidation('user', 'Invalid user', '当前用户不合法') }
      const params = Object.assign({}, req.body, {authorId: user._id})
      return await topicModel.createTopic(params)
    })()
      .then(data => res.json(data))
      .catch(err => next(err))
  })

router.route('/:id')
  .get(async (req, res, next) => {
    return await topicModel.getTopicById(req.params.id)
      .then(data => {
        if (!data) {next()}
        else {res.json({code: 0, data})}
      })
      .catch(err => next(err))
  })

  .patch(auth(), (req, res, next) => {
    (async () => {
      return await topicModel.upDateTopicById(req.params.id, req.body)
    })()
      .then(data => res.json(data))
      .catch(err => next(err))
  })
  .delete(auth({super: 1}), (req, res, next) => {
    (async () => {
      return await topicModel.deleteTopicById(req.params.id)
    })()
      .then(data => {
        res.json({
          code: 0,
          data: data
        })
      })
      .catch(err => next(err))
  })

router.route('/:topicId/reply')
  .post(auth(), (req, res, next) => {
    (async () => {
      const user = await userModel.getUserById(req.session.userId)
      if (!user) {throw new Error('Invalid user id')}
      return await replyModel.createReply(Object.assign(
        {},
        req.body,
        {
          authorId: req.session.userId,
          topicId: req.params.topicId
        }
      ))
    })()
      .then(data => res.json(data))
      .catch(err => next(err))
  })

module.exports = router
