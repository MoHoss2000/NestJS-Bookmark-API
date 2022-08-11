import * as pactum from 'pactum';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
    }));

    await app.init();
    await app.listen(3333);
    prisma = app.get(PrismaService);
    console.log("CLEANING DB")
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  })

  afterAll(() => {
    app.close();
  })



  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'vlad@gmail.com',
      password: '123'
    };
    describe('Signup', () => {
      it("should throw if email empty", () => {

        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password
          })
          .expectStatus(400)

      });

      it("should throw if password empty", () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email
          })
          .expectStatus(400)

      });

      it("should throw if no body provided", () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .expectStatus(400)

      });

      it("should signup", () => {

        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)

      });
    });

    describe('Signin', () => {
      it("should throw if email empty", () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password
          })
          .expectStatus(400)

      });

      it("should throw if password empty", () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email
          })
          .expectStatus(400)
      });

      it("should throw if no body provided", () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .expectStatus(400)

      });
      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token')

      })
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .get('/users/me')
          .expectStatus(200)
      });
    });

    describe('Edit user', () => {
      const dto: EditUserDto = {
        firstName: 'Vlad',
        email: 'vlad@code.com'
      };

      it('should update user', () => {
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(200)
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .get('/bookmarks')
          .expectStatus(200)
          .expectBody([])
      });
    });

    describe('Create bookmarks', () => {
      const dto: CreateBookmarkDto = {
        title: 'first bookmark',
        link: 'https://www.youtube.com/watch?v=GHTA143_b-s&t=4619s',
      }

      it('should create a bookmark', () => {
        return pactum
          .spec()
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .post('/bookmarks')
          .expectStatus(201)
          .stores('bookmarkId', 'id')
          .inspect()

      });
    });

    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .get('/bookmarks')
          .expectStatus(200)
          .expectJsonLength(1)
      });
    });

    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}')
      });
    });

    describe('Edit bookmark', () => {
      const dto: EditBookmarkDto = {
        description: 'this is description'
      };

      it('should edit bookmark by id', () => {
        return pactum
          .spec()
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withBody(dto)
          .expectStatus(200)
      });
    });

    describe('Delete bookmark', () => {
      it('should delete bookmark by id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(204)
          .inspect()
      });

      it('should get bookmarks', () => {
        return pactum
          .spec()
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .get('/bookmarks')
          .expectStatus(200)
          .expectBody([])

      });
    });
  });


});