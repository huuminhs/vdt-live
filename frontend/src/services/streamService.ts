import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

export interface Stream {
  streamId: number
  title: string
  description: string
  status: 'LIVE' | 'ENDED' | 'CREATED'
  creator: string
}

export interface StreamsResponse {
  items: Stream[]
  nextCursor: string | null
  hasMore: boolean
}

export interface StreamsParams {
  cursor?: string
  limit?: number
}

export interface CreateStreamRequest {
  title: string
  description: string
}

export interface CreateStreamResponse {
  streamId: number
  streamUrl: string
  mediamtxJwt: string
}

export const streamService = {
  async getStreams(params: StreamsParams = {}): Promise<StreamsResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.cursor) {
      searchParams.append('cursor', params.cursor)
    }

    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }

    const response = await axios.get<StreamsResponse>(
      `${API_BASE_URL}/stream?${searchParams.toString()}`
    )
    
    return response.data
  },

  async createStream(
    data: CreateStreamRequest, 
    authHeader: string
  ): Promise<CreateStreamResponse> {
    const response = await axios.post<CreateStreamResponse>(
      `${API_BASE_URL}/stream`,
      data,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    )
    
    return response.data
  }
}
