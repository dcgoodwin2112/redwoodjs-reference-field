import Post from 'src/components/Post'

export const QUERY = gql`
  query FIND_POST_BY_ID($id: Int!) {
    post: post(id: $id) {
      id
      title
      content
      author {
        id
        username
        email
      }
    }
  }
`

export const Loading = () => <div>Loading...</div>

export const Empty = () => <div>Post not found</div>

export const Success = ({ post }) => {
  return <Post post={post} />
}
