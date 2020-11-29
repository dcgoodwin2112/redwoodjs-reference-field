export const schema = gql`
  type Post {
    id: Int!
    title: String!
    content: String!
    authorId: Int!
    author: User!
  }

  type Query {
    posts: [Post!]!
    post(id: Int!): Post
  }

  input CreatePostInput {
    title: String!
    content: String!
    authorId: Int!
  }

  input UpdatePostInput {
    title: String
    content: String
    authorId: Int
  }

  type Mutation {
    createPost(input: CreatePostInput!): Post!
    updatePost(id: Int!, input: UpdatePostInput!): Post!
    deletePost(id: Int!): Post!
  }
`
