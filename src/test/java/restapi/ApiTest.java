package restapi;

import org.jboss.arquillian.container.test.api.Deployment;
import org.jboss.arquillian.test.api.ArquillianResource;
import org.jboss.shrinkwrap.api.ShrinkWrap;
import org.jboss.shrinkwrap.api.gradle.archive.importer.embedded.EmbeddedGradleImporter;
import org.jboss.shrinkwrap.api.spec.WebArchive;
import org.junit.After;
import org.junit.Before;
import persistence.manager.*;
import persistence.manager.generator.KeyGenerator;
import restapi.activity.model.CreateActivityJSON;
import restapi.game.model.CreateGameJSON;
import restapi.group.model.CreateGroupJSON;
import restapi.security.authentication.model.AuthenticationToken;
import restapi.security.authentication.model.SignInJSON;
import restapi.signup.model.SignUpJSON;
import restapi.user.model.UserData;
import util.ManagerUtil;
import util.RequestUtil;

import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Response;
import java.net.URL;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertThat;

/**
 * @author Tomas Perez Molina
 */
public abstract class ApiTest {

    private EntityManagerProducer emp;
    private UserManager userManager;
    private GameManager gameManager;
    private ActivityManager activityManager;
    private GroupManager groupManager;
    private PostManager postManager;

    @Deployment(testable = false)
    public static WebArchive createDeployment() {
        return ShrinkWrap.create(EmbeddedGradleImporter.class)
                .forThisProjectDirectory()
                .importBuildOutput().as(WebArchive.class);
    }

    @ArquillianResource
    protected URL base;

    protected AuthenticationToken token;

    protected WebTarget gamesTarget;
    protected WebTarget activitiesTarget;
    protected WebTarget groupsTarget;
    protected WebTarget postsTarget;
    protected WebTarget signInTarget;
    protected WebTarget signUpTarget;
    protected WebTarget usersTarget;
    protected WebTarget meTarget;


    @Before
    public void setup() throws Exception{
        emp = new EntityManagerProducer();
        emp.init();
        KeyGenerator kg = new KeyGenerator(emp.createEntityManager());
        postManager = new PostManager(emp.createEntityManager(), kg);
        postManager.wipeAllRecords();
        groupManager = new GroupManager(emp.createEntityManager(), kg);
        groupManager.wipeAllRecords();
        userManager = new UserManager(emp.createEntityManager(), kg);
        userManager.wipeAllRecords();
        activityManager = new ActivityManager(emp.createEntityManager(), kg);
        activityManager.wipeAllRecords();
        gameManager = new GameManager(emp.createEntityManager(), kg);
        gameManager.wipeAllRecords();

        String email = "test@mail.com";
        String password = "123123";
        ManagerUtil.addUser(
                userManager,
                "testUser",
                password,
                email,
                true
        );

        token = RequestUtil.getToken(base, email, password);

        assertNotNull(groupManager);
        assertNotNull(userManager);
        assertNotNull(activityManager);
        assertNotNull(gameManager);

        gamesTarget = RequestUtil.newRelativeTarget(base, "games");
        activitiesTarget = RequestUtil.newRelativeTarget(base, "activities");
        groupsTarget = RequestUtil.newRelativeTarget(base, "groups");
        postsTarget = RequestUtil.newRelativeTarget(base, "posts");
        signInTarget = RequestUtil.newRelativeTarget(base, "sign-in");
        signUpTarget = RequestUtil.newRelativeTarget(base, "sign-up");
        usersTarget = RequestUtil.newRelativeTarget(base, "users");
        meTarget = RequestUtil.newRelativeTarget(base, "users/me");
    }

    @After
    public void cleanUp(){
        KeyGenerator kg = new KeyGenerator(emp.createEntityManager());
        postManager = new PostManager(emp.createEntityManager(), kg);
        postManager.wipeAllRecords();
        groupManager = new GroupManager(emp.createEntityManager(), kg);
        groupManager.wipeAllRecords();
        activityManager = new ActivityManager(emp.createEntityManager(), kg);
        activityManager.wipeAllRecords();
        gameManager = new GameManager(emp.createEntityManager(), kg);
        gameManager.wipeAllRecords();
        userManager = new UserManager(emp.createEntityManager(), kg);
        userManager.wipeAllRecords();
        emp.destroy();
    }

    protected int addGame(String name){
        final Response postResponse = RequestUtil.post(gamesTarget, token, new CreateGameJSON(name));
        assertThat(postResponse.getStatus(), is(Response.Status.CREATED.getStatusCode()));
        final String location = postResponse.getHeaderString("Location");
        final WebTarget gameTarget = RequestUtil.newTarget(location);
        return Integer.parseInt(RequestUtil.getRelativePathDiff(gamesTarget, gameTarget));
    }

    protected int addActivity(String name, int gameID){
        final Response postResponse = RequestUtil.post(activitiesTarget, token, new CreateActivityJSON(name, gameID));
        assertThat(postResponse.getStatus(), is(Response.Status.CREATED.getStatusCode()));
        final String location = postResponse.getHeaderString("Location");
        final WebTarget activityTarget = RequestUtil.newTarget(location);
        return Integer.parseInt(RequestUtil.getRelativePathDiff(activitiesTarget, activityTarget));
    }

    protected int addGroup(int slots, int activityID, int userID){
        final Response postResponse = RequestUtil.post(groupsTarget, token, new CreateGroupJSON(slots, activityID, userID));
        assertThat(postResponse.getStatus(), is(Response.Status.CREATED.getStatusCode()));
        final String location = postResponse.getHeaderString("Location");
        final WebTarget groupTarget = RequestUtil.newTarget(location);
        return Integer.parseInt(RequestUtil.getRelativePathDiff(groupsTarget, groupTarget));
    }

    protected int addUser(String username, String password, String email){
        final Response signUpResponse = RequestUtil.post(signUpTarget, token, new SignUpJSON(email, password, username));
        assertThat(signUpResponse.getStatus(), is(Response.Status.CREATED.getStatusCode()));

        final Response signInResponse = RequestUtil.post(signInTarget, token, new SignInJSON(email, password));
        assertThat(signUpResponse.getStatus(), is(Response.Status.CREATED.getStatusCode()));

        AuthenticationToken userToken;
        try {
            userToken = RequestUtil.parseResponse(signInResponse, AuthenticationToken.class);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        final Response getUserResponse = RequestUtil.get(meTarget, userToken);


        UserData userData;
        try {
            userData = RequestUtil.parseResponse(getUserResponse, UserData.class);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        return userData.getId();
    }
}
